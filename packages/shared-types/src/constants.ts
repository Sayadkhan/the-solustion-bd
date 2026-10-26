/**
 * Core System Constants for The Solusation BD
 */

export const BRANCH_CODES = [
  "IDB",
  "MULTIPLAN",
  "UTTARA",
  "AGRABAD",
  "ONLINE_WAREHOUSE",
] as const;
export type BranchCode = (typeof BRANCH_CODES)[number];

// Alias for backwards compatibility if needed
export const BRANCHES = BRANCH_CODES;
export type BranchKey = BranchCode;

export const BRANCH_LABELS: Record<BranchCode, string> = {
  IDB: "IDB Bhaban Branch (Dhaka)",
  MULTIPLAN: "Multiplan Center Branch (Elephant Road, Dhaka)",
  UTTARA: "Uttara Branch (Sector 3, Dhaka)",
  AGRABAD: "Agrabad Branch (Chattogram)",
  ONLINE_WAREHOUSE: "Central Online Warehouse (Dhaka)",
};

export const STOCK_STATUSES = [
  "IN_STOCK",
  "OUT_OF_STOCK",
  "UPCOMING",
  "PRE_ORDER",
  "CALL_FOR_PRICE",
] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const COMPONENT_TYPES = [
  "CPU",
  "MOBO",
  "RAM",
  "GPU",
  "STORAGE",
  "PSU",
  "CASE",
  "COOLER",
  "MONITOR",
  "OTHER",
] as const;
export type ComponentType = (typeof COMPONENT_TYPES)[number];

export const SERIAL_STATUSES = [
  "IN_STOCK",
  "SOLD",
  "RMA_CLAIMED",
  "REPLACED",
] as const;
export type SerialStatus = (typeof SERIAL_STATUSES)[number];

export const PAYMENT_METHODS = [
  "COD",
  "BKASH",
  "NAGAD",
  "SSLCOMMERZ_CARD",
  "BANK_EMI",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PRICING_TIERS = ["CASH", "REGULAR"] as const;
export type PricingTier = (typeof PRICING_TIERS)[number];

export const COURIER_PROVIDERS = [
  "PATHAO",
  "STEADFAST",
  "REDX",
  "STORE_PICKUP",
] as const;
export type CourierProvider = (typeof COURIER_PROVIDERS)[number];

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "DISPATCHED",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const USER_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "BRANCH_MANAGER",
  "BRANCH_STAFF",
  "CUSTOMER",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const INQUIRY_STATUSES = ["PENDING", "CONTACTED", "RESOLVED"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const DELIVERY_ZONES = [
  "INSIDE_DHAKA",
  "OUTSIDE_DHAKA",
] as const;
export type DeliveryZone = (typeof DELIVERY_ZONES)[number];

export const OUTSIDE_DHAKA_DEPOSIT_THRESHOLD_BDT = 10000;
export const OUTSIDE_DHAKA_STANDARD_DEPOSIT_BDT = 1000;
export const OUTSIDE_DHAKA_MIN_DEPOSIT_BDT = 500;

export const BLOG_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

