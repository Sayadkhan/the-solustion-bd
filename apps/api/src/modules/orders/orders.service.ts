import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import {
  db,
  orders,
  orderItems,
  products,
  branchInventory,
  eq,
  and,
  or,
  gte,
  ne,
  desc,
  inArray,
  sql,
} from "@solusation/database";
import {
  normalizeBdPhone,
  formatBdt,
  CreateOrderDTO,
  ORDER_STATUSES,
  OrderStatus,
  OUTSIDE_DHAKA_STANDARD_DEPOSIT_BDT,
} from "@solusation/shared-types";
import crypto from "crypto";
import { applyPayment, calculateOrderTotals } from "./order-pricing";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

@Injectable()
export class OrdersService {
  async createOrder(input: CreateOrderDTO) {
    const customerPhone = normalizeBdPhone(input.customerPhone);
    if (!customerPhone) {
      throw new BadRequestException("Invalid Bangladeshi mobile number");
    }

    const invoiceNo = `SOL-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const trxId = input.paymentMethod === "BKASH" ? input.trxId || null : null;

    return db.transaction(async (tx) => {
      if (trxId) {
        await this.assertTrxIdUnused(tx, trxId);
      }

      const lines = await this.resolveLines(tx, input.items);
      const totals = calculateOrderTotals({
        lines,
        district: input.district,
        paymentMethod: input.paymentMethod,
        pricingTier: input.pricingTierUsed,
      });

      if (input.expectedTotalBdt !== undefined && input.expectedTotalBdt !== totals.totalPayableBdt) {
        throw new ConflictException(
          `Prices have changed since you added these items. The current total is ${formatBdt(
            totals.totalPayableBdt
          )}. Please remove the items from your cart and add them again.`
        );
      }

      await this.reserveStock(tx, lines);

      const [newOrder] = await tx
        .insert(orders)
        .values({
          invoiceNo,
          customerName: input.customerName,
          customerPhone,
          customerEmail: input.customerEmail,
          district: input.district,
          area: input.area,
          address: input.address,
          paymentMethod: input.paymentMethod,
          pricingTierUsed: input.pricingTierUsed,
          totalPayableBdt: totals.totalPayableBdt,
          paidAmountBdt: 0,
          dueAmountBdt: totals.totalPayableBdt,
          trxId,
          orderStatus: totals.orderStatus,
        })
        .returning();

      await tx.insert(orderItems).values(
        lines.map(({ product, qty }) => ({
          orderId: newOrder.id,
          productId: product.id,
          productName: product.name.slice(0, 255),
          qty,
          unitPriceBdt: totals.unitPrice(product),
        }))
      );

      return {
        ...newOrder,
        subtotalBdt: totals.subtotalBdt,
        deliveryFeeBdt: totals.deliveryFeeBdt,
        depositRequirement: totals.depositRequirement,
      };
    });
  }

  /** Finds each product by id or exact SKU. An unknown product is never substituted. */
  private async resolveLines(tx: DbTransaction, items: CreateOrderDTO["items"]) {
    const ids = items.map((i) => i.productId).filter((id) => UUID_REGEX.test(id));
    const skus = items.map((i) => i.sku).filter((sku): sku is string => Boolean(sku));

    const lookups = [
      ...(ids.length > 0 ? [inArray(products.id, ids)] : []),
      ...(skus.length > 0 ? [inArray(products.sku, skus)] : []),
    ];
    const found = lookups.length > 0 ? await tx.select().from(products).where(or(...lookups)) : [];

    const quantities = new Map<string, { product: (typeof found)[number]; qty: number }>();

    for (const item of items) {
      const product =
        found.find((p) => p.id === item.productId) ||
        (item.sku ? found.find((p) => p.sku === item.sku) : undefined);

      if (!product) {
        throw new BadRequestException(
          "An item in your cart is no longer available. Please remove it and try again."
        );
      }
      if (product.stockStatus !== "IN_STOCK" && product.stockStatus !== "PRE_ORDER") {
        throw new BadRequestException(`"${product.name}" cannot be ordered online right now.`);
      }

      const existing = quantities.get(product.id);
      if (existing) existing.qty += item.qty;
      else quantities.set(product.id, { product, qty: item.qty });
    }

    return [...quantities.values()];
  }

  /**
   * The stock check and decrement are one conditional UPDATE, so two customers
   * cannot both buy the last unit. Sorted ids keep lock order consistent.
   */
  private async reserveStock(tx: DbTransaction, lines: Awaited<ReturnType<OrdersService["resolveLines"]>>) {
    const sorted = [...lines].sort((a, b) => a.product.id.localeCompare(b.product.id));

    for (const { product, qty } of sorted) {
      if (product.stockStatus === "PRE_ORDER") continue;

      const [updated] = await tx
        .update(products)
        .set({
          totalStock: sql`${products.totalStock} - ${qty}`,
          stockStatus: sql`CASE WHEN ${products.totalStock} - ${qty} <= 0 THEN 'OUT_OF_STOCK'::stock_status ELSE ${products.stockStatus} END`,
          updatedAt: new Date(),
        })
        .where(and(eq(products.id, product.id), gte(products.totalStock, qty)))
        .returning({ id: products.id });

      if (!updated) {
        throw new BadRequestException(`Not enough stock for "${product.name}". Please reduce the quantity.`);
      }

      await tx
        .update(branchInventory)
        .set({ stock: sql`GREATEST(${branchInventory.stock} - ${qty}, 0)` })
        .where(
          and(eq(branchInventory.productId, product.id), eq(branchInventory.branchCode, "ONLINE_WAREHOUSE"))
        );
    }
  }

  private async restoreStock(tx: DbTransaction, orderId: string) {
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    for (const item of items) {
      // Pre-order items never reduced stock when the order was placed.
      await tx
        .update(products)
        .set({
          totalStock: sql`${products.totalStock} + ${item.qty}`,
          stockStatus: sql`CASE WHEN ${products.stockStatus} = 'OUT_OF_STOCK' THEN 'IN_STOCK'::stock_status ELSE ${products.stockStatus} END`,
          updatedAt: new Date(),
        })
        .where(and(eq(products.id, item.productId), ne(products.stockStatus, "PRE_ORDER")));

      await tx
        .update(branchInventory)
        .set({ stock: sql`${branchInventory.stock} + ${item.qty}` })
        .where(
          and(eq(branchInventory.productId, item.productId), eq(branchInventory.branchCode, "ONLINE_WAREHOUSE"))
        );
    }
  }

  private async assertTrxIdUnused(tx: DbTransaction, trxId: string, exceptOrderId?: string) {
    const [existing] = await tx
      .select({ id: orders.id })
      .from(orders)
      .where(
        exceptOrderId ? and(eq(orders.trxId, trxId), ne(orders.id, exceptOrderId)) : eq(orders.trxId, trxId)
      )
      .limit(1);

    if (existing) {
      throw new ConflictException("This bKash TrxID has already been used on another order.");
    }
  }

  async getOrderByNumber(orderNumber: string) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.invoiceNo, orderNumber),
      with: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order #${orderNumber} not found`);
    }

    return order;
  }

  /** Customer tracking: the invoice number alone must not reveal someone's address. */
  async trackOrder(orderNumber: string, phone: string) {
    const normalizedPhone = normalizeBdPhone(phone);
    const order = normalizedPhone
      ? await db.query.orders.findFirst({
          where: eq(orders.invoiceNo, orderNumber),
          with: { items: true },
        })
      : undefined;

    // The same response for a wrong invoice or a wrong phone.
    if (!order || normalizeBdPhone(order.customerPhone) !== normalizedPhone) {
      throw new NotFoundException("No order matches this invoice number and mobile number.");
    }

    return order;
  }

  async getOrders(limit = 20, page = 1) {
    const offset = (page - 1) * limit;
    return db.query.orders.findMany({
      limit,
      offset,
      orderBy: [desc(orders.createdAt)],
      with: {
        items: true,
      },
    });
  }

  async updateOrderStatus(orderNumber: string, status: string) {
    if (!ORDER_STATUSES.includes(status as OrderStatus)) {
      throw new BadRequestException(`Invalid order status. Allowed: ${ORDER_STATUSES.join(", ")}.`);
    }

    return db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.invoiceNo, orderNumber))
        .for("update");

      if (!order) {
        throw new NotFoundException(`Order #${orderNumber} not found`);
      }

      if (order.orderStatus === "CANCELLED" && status !== "CANCELLED") {
        throw new BadRequestException(
          "A cancelled order cannot be reopened because its stock has been returned. Please place a new order."
        );
      }

      if (status === "CANCELLED" && order.orderStatus !== "CANCELLED") {
        await this.restoreStock(tx, order.id);
      }

      const [updated] = await tx
        .update(orders)
        .set({ orderStatus: status as OrderStatus, updatedAt: new Date() })
        .where(eq(orders.id, order.id))
        .returning();

      return updated;
    });
  }

  /**
   * Staff confirm a bKash payment they have checked themselves. With no amount
   * given: a bKash order is paid in full, and a COD order pays the standard deposit.
   */
  async verifyDeposit(orderNumber: string, rawTrxId: string, amount?: number) {
    const trxId = rawTrxId.trim().toUpperCase();

    return db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.invoiceNo, orderNumber))
        .for("update");

      if (!order) {
        throw new NotFoundException(`Order #${orderNumber} not found`);
      }
      if (order.orderStatus === "CANCELLED") {
        throw new BadRequestException("This order has been cancelled.");
      }
      if (order.paidAmountBdt > 0 && order.trxId === trxId) {
        throw new ConflictException("This TrxID has already been recorded on this order.");
      }

      await this.assertTrxIdUnused(tx, trxId, order.id);

      const amountBdt =
        amount ?? (order.paymentMethod === "BKASH" ? order.dueAmountBdt : OUTSIDE_DHAKA_STANDARD_DEPOSIT_BDT);

      const payment = applyPayment(order, amountBdt);
      if (!payment) {
        throw new BadRequestException(
          `Invalid amount. This order has ${formatBdt(order.dueAmountBdt)} due.`
        );
      }

      const [updated] = await tx
        .update(orders)
        .set({ ...payment, trxId, orderStatus: "CONFIRMED", updatedAt: new Date() })
        .where(eq(orders.id, order.id))
        .returning();

      return updated;
    });
  }
}
