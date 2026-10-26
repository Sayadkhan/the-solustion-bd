import { z } from "zod";

export const CategorySchema = z.object({
  id: z.string().uuid().optional(),
  parentId: z.string().uuid().nullable().optional(),
  name: z.string().min(2, "Category name must be at least 2 characters"),
  slug: z.string().min(2),
  icon: z.string().nullable().optional(),
  filterableAttributes: z.array(z.string()).default([]),
  isFeaturedInMegaMenu: z.boolean().default(false),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type CategoryDTO = z.infer<typeof CategorySchema>;

export const CreateCategorySchema = CategorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateCategoryDTO = z.infer<typeof CreateCategorySchema>;
