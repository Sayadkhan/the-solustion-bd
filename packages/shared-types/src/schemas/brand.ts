import { z } from "zod";

export const BrandSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Brand name must be at least 2 characters"),
  slug: z.string().min(2),
  logoUrl: z.string().url().nullable().optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type BrandDTO = z.infer<typeof BrandSchema>;

export const CreateBrandSchema = BrandSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateBrandDTO = z.infer<typeof CreateBrandSchema>;
