import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { db, orders, orderItems, products, eq, desc } from "@solusation/database";
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
        // Resolve valid product IDs to satisfy UUID & foreign key constraints
        const existingProducts = await tx
          .select({ id: products.id, name: products.name, sku: products.sku })
          .from(products);
        const fallbackProductId = existingProducts[0]?.id;
        const isUuid = (val: string) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

        const itemsToInsert = input.items.map((i) => {
          let resolvedProductId = i.productId;
          const matchByUuid =
            isUuid(i.productId) && existingProducts.find((p) => p.id === i.productId);
          if (!matchByUuid) {
            const matchBySkuOrName = existingProducts.find(
              (p) =>
                (p.sku && i.productName && p.sku.toLowerCase() === i.productName.toLowerCase()) ||
                (p.name && i.productName && p.name.toLowerCase().includes(i.productName.toLowerCase())) ||
                (p.name && i.productName && i.productName.toLowerCase().includes(p.name.toLowerCase()))
            );
            resolvedProductId = matchBySkuOrName?.id || fallbackProductId || i.productId;
          }

          return {
            orderId: newOrder.id,
            productId: resolvedProductId,
            productName: i.productName,
            qty: i.qty,
            unitPriceBdt: i.unitPriceBdt,
            assignedSerials: i.assignedSerials || [],
          };
        });

        await tx.insert(orderItems).values(itemsToInsert);
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
