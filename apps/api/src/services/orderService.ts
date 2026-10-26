import { db, orders, orderItems, eq, desc } from "@solusation/database";
import {
  calculateAdvanceDepositRequirement,
  normalizeBdPhone,
  CreateOrderDTO,
} from "@solusation/shared-types";
import crypto from "crypto";

export class OrderService {
  async createOrder(input: CreateOrderDTO) {
    // 1. Calculate pricing
    const totalPayableBdt = input.items.reduce(
      (acc, item) => acc + item.unitPriceBdt * item.qty,
      0
    );

    // 2. Evaluate Rule 4.5: Outside Dhaka Advance Deposit Rule
    const depositCheck = calculateAdvanceDepositRequirement({
      district: input.district,
      totalBdt: totalPayableBdt,
      paymentMethod: input.paymentMethod,
    });

    // 3. Generate Invoice No
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const invoiceNo = input.invoiceNo || `SOL-${new Date().getFullYear()}-${randomSuffix}`;

    // 4. Normalize Bangladeshi Phone Number
    const normalizedPhone = normalizeBdPhone(input.customerPhone) || input.customerPhone;

    // 5. Atomic transaction creating order and order items
    const createdOrder = await db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values({
          invoiceNo,
          customerName: input.customerName,
          customerPhone: normalizedPhone,
          customerEmail: input.customerEmail,
          district: input.district,
          area: input.area,
          address: input.address,
          paymentMethod: input.paymentMethod,
          pricingTierUsed: input.pricingTierUsed || "CASH",
          emiTenureMonths: input.emiTenureMonths || 0,
          totalPayableBdt,
          paidAmountBdt: input.paidAmountBdt || (depositCheck.requiresDeposit ? depositCheck.depositAmountBdt : 0),
          dueAmountBdt:
            input.dueAmountBdt ??
            (totalPayableBdt - (input.paidAmountBdt || (depositCheck.requiresDeposit ? depositCheck.depositAmountBdt : 0))),
          trxId: input.trxId,
          courierProvider: input.courierProvider || "STEADFAST",
          consignmentId: input.consignmentId,
          orderStatus: input.orderStatus || (depositCheck.requiresDeposit ? "PENDING" : "CONFIRMED"),
        })
        .returning();

      if (input.items && input.items.length > 0) {
        await tx.insert(orderItems).values(
          input.items.map((i) => ({
            orderId: newOrder.id,
            productId: i.productId,
            productName: i.productName,
            qty: i.qty,
            unitPriceBdt: i.unitPriceBdt,
            assignedSerials: i.assignedSerials || [],
          }))
        );
      }

      return newOrder;
    });

    return db.query.orders.findFirst({
      where: eq(orders.id, createdOrder.id),
      with: {
        items: true,
      },
    });
  }

  async getOrderByInvoice(invoiceNo: string) {
    return db.query.orders.findFirst({
      where: eq(orders.invoiceNo, invoiceNo),
      with: {
        items: true,
      },
    });
  }

  async getOrderByNumber(orderNumber: string) {
    return this.getOrderByInvoice(orderNumber);
  }

  async getOrders(limit = 20, page = 1) {
    const offset = (page - 1) * limit;
    return db.query.orders.findMany({
      orderBy: [desc(orders.createdAt)],
      limit,
      offset,
      with: {
        items: true,
      },
    });
  }
}

export const orderService = new OrderService();
