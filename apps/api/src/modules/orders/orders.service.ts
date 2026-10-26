import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { db, orders, orderItems, eq, desc } from "@solusation/database";
import {
  calculateAdvanceDepositRequirement,
  normalizeBdPhone,
  CreateOrderDTO,
} from "@solusation/shared-types";
import crypto from "crypto";

@Injectable()
export class OrdersService {
  async createOrder(input: CreateOrderDTO) {
    if (!input.items || input.items.length === 0) {
      throw new BadRequestException("Order must contain at least one item.");
    }

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

    // 3. Generate Invoice No (e.g. SOL-2026-A1B2C3)
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
          paidAmountBdt:
            input.paidAmountBdt ||
            (depositCheck.requiresDeposit ? depositCheck.depositAmountBdt : 0),
          dueAmountBdt:
            input.dueAmountBdt ??
            (totalPayableBdt -
              (input.paidAmountBdt ||
                (depositCheck.requiresDeposit ? depositCheck.depositAmountBdt : 0))),
          trxId: input.trxId,
          courierProvider: input.courierProvider || "STEADFAST",
          consignmentId: input.consignmentId,
          orderStatus:
            input.orderStatus || (depositCheck.requiresDeposit ? "PENDING" : "CONFIRMED"),
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

    return {
      ...createdOrder,
      depositRequirement: depositCheck,
    };
  }

  async getOrderByNumber(orderNumber: string) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.invoiceNo, orderNumber),
      with: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order #${orderNumber} not found`);
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

  async updateOrderStatus(orderNumber: string, status: any) {
    const [updated] = await db
      .update(orders)
      .set({ orderStatus: status, updatedAt: new Date() })
      .where(eq(orders.invoiceNo, orderNumber))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Order #${orderNumber} not found`);
    }

    return updated;
  }

  async verifyDeposit(orderNumber: string, trxId: string, amount: number) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.invoiceNo, orderNumber),
    });

    if (!order) {
      throw new NotFoundException(`Order #${orderNumber} not found`);
    }

    const newPaid = (order.paidAmountBdt || 0) + amount;
    const newDue = Math.max(0, order.totalPayableBdt - newPaid);

    const [updated] = await db
      .update(orders)
      .set({
        paidAmountBdt: newPaid,
        dueAmountBdt: newDue,
        trxId,
        orderStatus: "CONFIRMED",
        updatedAt: new Date(),
      })
      .where(eq(orders.invoiceNo, orderNumber))
      .returning();

    return updated;
  }
}
