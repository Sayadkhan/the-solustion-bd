import { z } from "zod";
import { BLOG_STATUSES } from "../constants";

export const BlogBacklinkSchema = z.object({
  anchorText: z.string().min(1, "Anchor text is required"),
  url: z.string().url("Valid URL is required"),
  rel: z.enum(["dofollow", "nofollow", "sponsored", "ugc"]).default("dofollow"),
  targetBlank: z.boolean().default(true),
});
export type BlogBacklink = z.infer<typeof BlogBacklinkSchema>;

export const BlogSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  excerpt: z.string().nullable().optional(),
  content: z.string().min(10, "Content is required"),
  featuredImage: z.string().nullable().optional(),
  authorName: z.string().default("The Solusation BD Editorial"),
  category: z.string().default("Tech Guide"),
  tags: z.array(z.string()).default([]),
  status: z.enum(BLOG_STATUSES).default("DRAFT"),
  viewCount: z.number().int().nonnegative().default(0),
  readingTimeMinutes: z.number().int().positive().default(3),

  // Advanced SEO Capabilities
  metaTitle: z.string().max(100).nullable().optional(),
  metaDescription: z.string().max(200).nullable().optional(),
  metaKeywords: z.array(z.string()).default([]),
  canonicalUrl: z.string().nullable().optional(),
  ogImage: z.string().nullable().optional(),

  // Structured Backlinks Registry
  backlinks: z.array(BlogBacklinkSchema).default([]),

  publishedAt: z.date().or(z.string()).nullable().optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});
export type BlogDTO = z.infer<typeof BlogSchema>;

export const CreateBlogInputSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().min(10, "Content is required"),
  featuredImage: z.string().nullable().optional(),
  authorName: z.string().optional().default("The Solusation BD Editorial"),
  category: z.string().optional().default("Tech Guide"),
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(BLOG_STATUSES).optional().default("PUBLISHED"),
  readingTimeMinutes: z.number().int().positive().optional(),

  // SEO fields
  metaTitle: z.string().max(100).optional(),
  metaDescription: z.string().max(200).optional(),
  metaKeywords: z.array(z.string()).optional().default([]),
  canonicalUrl: z.string().optional(),
  ogImage: z.string().optional(),

  // Backlinks
  backlinks: z.array(BlogBacklinkSchema).optional().default([]),
});
export type CreateBlogInput = z.infer<typeof CreateBlogInputSchema>;

export const UpdateBlogInputSchema = CreateBlogInputSchema.partial();
export type UpdateBlogInput = z.infer<typeof UpdateBlogInputSchema>;
