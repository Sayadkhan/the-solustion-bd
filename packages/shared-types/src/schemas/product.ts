import { z } from "zod";
import { BRANCH_CODES, STOCK_STATUSES } from "../constants";
import { CompatibilitySchema } from "./compatibility";

export const ProductSpecificationItemSchema = z.object({
  group: z.string(), // e.g. "General", "Performance", "Physical Dimensions"
  label: z.string(), // e.g. "Socket", "Base Clock", "Cores"
  value: z.string(), // e.g. "AM5", "4.7 GHz", "8 Cores"
});
export type ProductSpecificationItem = z.infer<typeof ProductSpecificationItemSchema>;

export const BranchInventorySchema = z.object({
  branchCode: z.enum(BRANCH_CODES),
  stock: z.number().int().nonnegative().default(0),
});
export type BranchInventoryDTO = z.infer<typeof BranchInventorySchema>;

export const ProductSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().min(2, "SKU is required"),
  name: z.string().min(2, "Product name must be at least 2 characters"),
  slug: z.string().min(2),
  brandId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  categorySlug: z.string().optional(),
  images: z.array(z.string().url()).default([]),
  keyFeatures: z.array(z.string()).default([]),

  // Bangladeshi Dual Pricing (Stored as integers in whole BDT)
  cashPriceBdt: z.number().int().positive("Cash price must be greater than 0"),
  regularPriceBdt: z.number().int().positive("Regular price must be greater than 0"),
  costPriceBdt: z.number().int().nonnegative().optional(),
  isEmiAvailable: z.boolean().default(true),

  // Stock summary
  totalStock: z.number().int().nonnegative().default(0),
  stockStatus: z.enum(STOCK_STATUSES).default("IN_STOCK"),
  branchInventory: z.array(BranchInventorySchema).default([]),

  // Hardware Specifications & PC Builder Compatibility
  specifications: z.array(ProductSpecificationItemSchema).default([]),
  compatibility: CompatibilitySchema.optional().nullable(),

  // Warranty Information
  warrantyDurationMonths: z.number().int().nonnegative().default(12),
  warrantyTerms: z.string().optional().nullable(),

  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type ProductDTO = z.infer<typeof ProductSchema>;

export const CreateProductSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateProductDTO = z.infer<typeof CreateProductSchema>;
