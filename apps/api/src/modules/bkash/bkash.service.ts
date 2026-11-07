import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { db, orders, eq } from "@solusation/database";
import { OUTSIDE_DHAKA_STANDARD_DEPOSIT_BDT } from "@solusation/shared-types";
import { ENV } from "../../config/env";
import { applyPayment } from "../orders/order-pricing";

const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 30_000;

interface BkashPaymentResult {
  statusCode?: string;
  statusMessage?: string;
  transactionStatus?: string;
  paymentID?: string;
  trxID?: string;
  amount?: string;
  merchantInvoiceNumber?: string;
}

/**
 * bKash Tokenized Checkout. The customer enters their wallet number, OTP and PIN
 * on bKash's own page, never on this site. An order is marked paid only after
 * bKash itself reports the transaction as completed.
 */
@Injectable()
export class BkashService {
  private readonly logger = new Logger(BkashService.name);
  private cachedToken: { value: string; expiresAt: number } | null = null;

  private get isGatewayConfigured(): boolean {
    const { APP_KEY, APP_SECRET, USERNAME, PASSWORD } = ENV.BKASH;
    // Keys beginning "sandbox_" are placeholders that were never issued by bKash.
    return Boolean(APP_KEY && APP_SECRET && USERNAME && PASSWORD) && !APP_KEY.startsWith("sandbox_");
  }

  getConfig() {
    return {
      merchantNumber: ENV.BKASH.MERCHANT_NUMBER,
      brandName: "The Solutions BD",
      gatewayEnabled: this.isGatewayConfigured,
    };
  }

  private async bkashRequest<T>(path: string, headers: Record<string, string>, body: unknown): Promise<T> {
    const res = await fetch(`${ENV.BKASH.BASE_URL}/tokenized/checkout/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`bKash ${path} responded with HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  }

  /** bKash asks merchants to reuse a grant token for its lifetime. */
  private async getToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return this.cachedToken.value;
    }

    const data = await this.bkashRequest<{ id_token?: string; expires_in?: number | string; statusMessage?: string }>(
      "token/grant",
      { username: ENV.BKASH.USERNAME, password: ENV.BKASH.PASSWORD },
      { app_key: ENV.BKASH.APP_KEY, app_secret: ENV.BKASH.APP_SECRET }
    );

    if (!data.id_token) {
      throw new Error(`bKash token grant refused: ${data.statusMessage || "no token returned"}`);
    }

    const lifetimeMs = Number(data.expires_in || 3600) * 1000;
    this.cachedToken = {
      value: data.id_token,
      expiresAt: Date.now() + Math.max(lifetimeMs - TOKEN_REFRESH_MARGIN_MS, 0),
    };
    return data.id_token;
  }

  private async authedRequest<T>(path: string, body: unknown): Promise<T> {
    const token = await this.getToken();
    return this.bkashRequest<T>(path, { Authorization: token, "X-APP-Key": ENV.BKASH.APP_KEY }, body);
  }

  /** The amount always comes from the order, never from the browser. */
  private amountToCollect(order: typeof orders.$inferSelect): number {
    if (order.paymentMethod === "BKASH") return order.dueAmountBdt;
    return order.paidAmountBdt === 0 ? Math.min(OUTSIDE_DHAKA_STANDARD_DEPOSIT_BDT, order.dueAmountBdt) : 0;
  }

  async createPayment(invoiceNo: string) {
    if (!this.isGatewayConfigured) {
      throw new ServiceUnavailableException(
        "Online bKash payment is not available right now. Please pay by bKash Send Money and enter your TrxID."
      );
    }

    const order = await db.query.orders.findFirst({ where: eq(orders.invoiceNo, invoiceNo) });
    if (!order) {
      throw new NotFoundException(`Order #${invoiceNo} not found`);
    }
    if (order.orderStatus === "CANCELLED") {
      throw new BadRequestException("This order has been cancelled.");
    }

    const amount = this.amountToCollect(order);
    if (amount <= 0) {
      throw new BadRequestException("Nothing is due on this order.");
    }

    let data: BkashPaymentResult & { bkashURL?: string };
    try {
      data = await this.authedRequest("create", {
        mode: "0011",
        payerReference: order.customerPhone.replace(/^\+88/, ""),
        callbackURL: `${ENV.STOREFRONT_URL}/payment/bkash`,
        amount: amount.toFixed(2),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: order.invoiceNo,
      });
    } catch (err) {
      this.logger.error(`bKash create failed for #${invoiceNo}: ${(err as Error).message}`);
      throw new BadGatewayException("Could not reach bKash. Please try again shortly.");
    }

    if (!data.paymentID || !data.bkashURL) {
      this.logger.error(`bKash create refused for #${invoiceNo}: ${data.statusCode} ${data.statusMessage}`);
      throw new BadGatewayException(data.statusMessage || "bKash could not start this payment.");
    }

    return { paymentID: data.paymentID, bkashURL: data.bkashURL, amount, invoiceNo: order.invoiceNo };
  }

  /**
   * Called after bKash redirects the customer back. The order, amount and TrxID
   * are all taken from bKash's response, so nothing the browser sends can mark an
   * order paid. Safe to repeat: a second call finds the payment already recorded.
   */
  async executePayment(paymentID: string) {
    if (!this.isGatewayConfigured) {
      throw new ServiceUnavailableException("Online bKash payment is not available right now.");
    }

    const result = await this.confirmWithBkash(paymentID);

    if (result.transactionStatus !== "Completed" || !result.trxID || !result.merchantInvoiceNumber) {
      throw new BadRequestException(result.statusMessage || "The bKash payment was not completed.");
    }

    const invoiceNo = result.merchantInvoiceNumber;
    const trxID = result.trxID;
    const amount = Math.round(Number(result.amount));

    return db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.invoiceNo, invoiceNo)).for("update");

      if (!order) {
        // Money has moved at this point, so this needs a person to look at it.
        this.logger.error(`bKash payment ${paymentID} (TrxID ${trxID}) has unknown invoice ${invoiceNo}`);
        throw new NotFoundException(`Order #${invoiceNo} not found. Please contact support with TrxID ${trxID}.`);
      }

      if (order.trxId === trxID && order.paidAmountBdt > 0) {
        return this.toReceipt(order, trxID, amount);
      }

      const payment = applyPayment(order, amount);
      if (!payment) {
        this.logger.error(
          `bKash TrxID ${trxID} paid ${amount} on #${invoiceNo} with ${order.dueAmountBdt} due. Needs manual review.`
        );
        throw new BadRequestException(`Payment needs manual review. Please contact support with TrxID ${trxID}.`);
      }

      if (order.orderStatus === "CANCELLED") {
        this.logger.error(`bKash TrxID ${trxID} paid on cancelled order #${invoiceNo}. A refund may be needed.`);
      }

      // A COD deposit confirms the order. A bKash order is confirmed once fully paid.
      const isConfirmed = order.paymentMethod === "COD" || payment.dueAmountBdt === 0;

      const [updated] = await tx
        .update(orders)
        .set({
          ...payment,
          trxId: trxID,
          orderStatus:
            order.orderStatus === "PENDING" && isConfirmed ? "CONFIRMED" : order.orderStatus,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id))
        .returning();

      this.logger.log(`Order #${invoiceNo} received ${amount} BDT, bKash TrxID ${trxID}`);
      return this.toReceipt(updated, trxID, amount);
    });
  }

  /** Executes the payment. If that is inconclusive, asks bKash for the payment's real state. */
  private async confirmWithBkash(paymentID: string): Promise<BkashPaymentResult> {
    try {
      const executed = await this.authedRequest<BkashPaymentResult>("execute", { paymentID });
      if (executed.transactionStatus === "Completed") return executed;
      this.logger.warn(`bKash execute for ${paymentID}: ${executed.statusCode} ${executed.statusMessage}`);
    } catch (err) {
      // A timeout here does not mean the payment failed, so the status check decides.
      this.logger.warn(`bKash execute failed for ${paymentID}: ${(err as Error).message}`);
    }

    try {
      return await this.authedRequest<BkashPaymentResult>("payment/status", { paymentID });
    } catch (err) {
      this.logger.error(`bKash status check failed for ${paymentID}: ${(err as Error).message}`);
      throw new BadGatewayException(
        "Could not confirm your payment with bKash. If money was deducted, please contact support."
      );
    }
  }

  private toReceipt(order: typeof orders.$inferSelect, trxID: string, amount: number) {
    return {
      trxID,
      amount,
      invoiceNo: order.invoiceNo,
      orderStatus: order.orderStatus,
      paidAmountBdt: order.paidAmountBdt,
      dueAmountBdt: order.dueAmountBdt,
    };
  }

  /** Admin lookup of what bKash reports for a payment. */
  async queryPayment(paymentID: string) {
    if (!this.isGatewayConfigured) {
      throw new ServiceUnavailableException("Online bKash payment is not configured.");
    }
    return this.authedRequest<BkashPaymentResult>("payment/status", { paymentID });
  }
}
