import { z } from "zod";
import {
  PAYMENT_METHODS,
  PRICING_TIERS,
  COURIER_PROVIDERS,
  ORDER_STATUSES,
  OUTSIDE_DHAKA_DEPOSIT_THRESHOLD_BDT,
  OUTSIDE_DHAKA_STANDARD_DEPOSIT_BDT,
} from "../constants";
import { BD_PHONE_REGEX } from "../phone";

export const OrderItemSchema = z.object({
  id: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  productId: z.string().min(1),
  productName: z.string().min(2),
  qty: z.number().int().positive().default(1),
  unitPriceBdt: z.number().int().positive(),
  assignedSerials: z.array(z.string()).default([]),
});
export type OrderItemDTO = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
  id: z.string().uuid().optional(),
  invoiceNo: z.string().min(3),
  customerName: z.string().min(2, "Customer name is required"),
  customerPhone: z.string().regex(BD_PHONE_REGEX, "Invalid Bangladeshi mobile number"),
  customerEmail: z.string().email().nullable().optional(),
  district: z.string().min(2, "District is required"), // e.g. "Dhaka", "Chattogram"
  area: z.string().min(2, "Area is required"), // e.g. "Dhanmondi", "Agrabad"
  address: z.string().min(5, "Street address is required"),
  paymentMethod: z.enum(PAYMENT_METHODS),
  pricingTierUsed: z.enum(PRICING_TIERS).default("CASH"),
  emiTenureMonths: z.number().int().nonnegative().default(0),
  totalPayableBdt: z.number().int().positive(),
  paidAmountBdt: z.number().int().nonnegative().default(0),
  dueAmountBdt: z.number().int().nonnegative().default(0),
  trxId: z.string().nullable().optional(),
  courierProvider: z.enum(COURIER_PROVIDERS).default("STEADFAST"),
  consignmentId: z.string().nullable().optional(),
  orderStatus: z.enum(ORDER_STATUSES).default("PENDING"),
  items: z.array(OrderItemSchema).optional(),
  createdAt: z.date().or(z.string()).optional(),
});

export type OrderDTO = z.infer<typeof OrderSchema>;

export const CreateOrderSchema = z.object({
  invoiceNo: z.string().optional(),
  customerName: z.string().min(2, "Customer name is required"),
  customerPhone: z.string().regex(BD_PHONE_REGEX, "Invalid Bangladeshi mobile number"),
  customerEmail: z.string().email().nullable().optional(),
  district: z.string().min(2, "District is required"),
  area: z.string().min(2, "Area is required"),
  address: z.string().min(5, "Street address is required"),
  paymentMethod: z.enum(PAYMENT_METHODS),
  pricingTierUsed: z.enum(PRICING_TIERS).default("CASH"),
  emiTenureMonths: z.number().int().nonnegative().default(0),
  totalPayableBdt: z.number().int().positive().optional(),
  paidAmountBdt: z.number().int().nonnegative().default(0),
  dueAmountBdt: z.number().int().nonnegative().optional(),
  trxId: z.string().nullable().optional(),
  courierProvider: z.enum(COURIER_PROVIDERS).default("STEADFAST"),
  consignmentId: z.string().nullable().optional(),
  orderStatus: z.enum(ORDER_STATUSES).default("PENDING"),
  items: z.array(OrderItemSchema).min(1, "Order must have at least one item"),
});
export type CreateOrderDTO = z.infer<typeof CreateOrderSchema>;

/**
 * Checks if an order requires advance delivery deposit according to Rule 4.5:
 * Orders outside Dhaka district over ৳10,000 selecting Cash on Delivery (COD)
 * require an advance deposit (৳1,000).
 */
export function calculateAdvanceDepositRequirement(params: {
  district: string;
  totalBdt: number;
  paymentMethod: string;
}): { requiresDeposit: boolean; depositAmountBdt: number; reason?: string } {
  const isOutsideDhaka = params.district.trim().toLowerCase() !== "dhaka";
  const isCod = params.paymentMethod === "COD";
  const isOverThreshold = params.totalBdt >= OUTSIDE_DHAKA_DEPOSIT_THRESHOLD_BDT;

  if (isOutsideDhaka && isCod && isOverThreshold) {
    return {
      requiresDeposit: true,
      depositAmountBdt: OUTSIDE_DHAKA_STANDARD_DEPOSIT_BDT,
      reason: `Outside-Dhaka COD orders over ৳${OUTSIDE_DHAKA_DEPOSIT_THRESHOLD_BDT.toLocaleString(
        "en-IN"
      )} require an advance delivery deposit of ৳${OUTSIDE_DHAKA_STANDARD_DEPOSIT_BDT} via bKash/Nagad before order dispatch.`,
    };
  }

  return {
    requiresDeposit: false,
    depositAmountBdt: 0,
  };
}
