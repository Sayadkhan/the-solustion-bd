import { pgEnum } from "drizzle-orm/pg-core";
import {
  BRANCH_CODES,
  STOCK_STATUSES,
  COMPONENT_TYPES,
  SERIAL_STATUSES,
  PAYMENT_METHODS,
  PRICING_TIERS,
  COURIER_PROVIDERS,
  ORDER_STATUSES,
  USER_ROLES,
  INQUIRY_STATUSES,
  BLOG_STATUSES,
} from "@solusation/shared-types";

export const stockStatusEnum = pgEnum("stock_status", STOCK_STATUSES);
export const branchCodeEnum = pgEnum("branch_code", BRANCH_CODES);
export const componentTypeEnum = pgEnum("component_type", COMPONENT_TYPES);
export const serialStatusEnum = pgEnum("serial_status", SERIAL_STATUSES);
export const paymentMethodEnum = pgEnum("payment_method", PAYMENT_METHODS);
export const pricingTierEnum = pgEnum("pricing_tier", PRICING_TIERS);
export const courierProviderEnum = pgEnum("courier_provider", COURIER_PROVIDERS);
export const orderStatusEnum = pgEnum("order_status", ORDER_STATUSES);
export const userRoleEnum = pgEnum("user_role", USER_ROLES);
export const inquiryStatusEnum = pgEnum("inquiry_status", INQUIRY_STATUSES);
export const blogStatusEnum = pgEnum("blog_status", BLOG_STATUSES);
