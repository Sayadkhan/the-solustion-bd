import { z } from "zod";
import { SERIAL_STATUSES } from "../constants";

export const ProductSerialSchema = z.object({
  id: z.string().uuid().optional(),
  serialNumber: z.string().min(3, "Serial number is required"),
  productId: z.string().uuid(),
  supplierName: z.string().min(2, "Supplier name is required"),
  status: z.enum(SERIAL_STATUSES).default("IN_STOCK"),
  orderId: z.string().uuid().nullable().optional(),
  warrantyExpiresAt: z.date().or(z.string()).nullable().optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type ProductSerialDTO = z.infer<typeof ProductSerialSchema>;

export const CreateProductSerialSchema = ProductSerialSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateProductSerialDTO = z.infer<typeof CreateProductSerialSchema>;
