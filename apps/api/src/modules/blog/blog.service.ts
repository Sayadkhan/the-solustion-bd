import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { db, blogs, eq, desc, and, ilike, sql } from "@solusation/database";
import {
  CreateBlogInput,
  UpdateBlogInput,
  BlogStatus,
} from "@solusation/shared-types";
import { redis } from "../../config/redis";

@Injectable()
export class BlogService {
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  async createBlog(input: CreateBlogInput, authorId?: string) {
    let slug = input.slug ? this.generateSlug(input.slug) : this.generateSlug(input.title);

    // Ensure unique slug
    const existing = await db.query.blogs.findFirst({
      where: eq(blogs.slug, slug),
    });

    if (existing) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const readingTimeMinutes =
      input.readingTimeMinutes || this.calculateReadingTime(input.content);

    // Auto-fill SEO metadata if not explicitly provided
    const metaTitle = input.metaTitle || input.title.slice(0, 70);
    const metaDescription =
      input.metaDescription || (input.excerpt ? input.excerpt.slice(0, 160) : input.title);
    const canonicalUrl =
      input.canonicalUrl || `https://thesolusationbd.com/blog/${slug}`;

    const [newPost] = await db
      .insert(blogs)
      .values({
        title: input.title.trim(),
        slug,
        excerpt: input.excerpt || null,
        content: input.content,
        featuredImage: input.featuredImage || null,
        authorId: authorId || null,
        authorName: input.authorName || "The Solusation BD Editorial",
        category: input.category || "Tech Guide",
        tags: input.tags || [],
        status: input.status || "PUBLISHED",
        readingTimeMinutes,
        metaTitle,
        metaDescription,
        metaKeywords: input.metaKeywords || [],
        canonicalUrl,
        ogImage: input.ogImage || input.featuredImage || null,
        backlinks: input.backlinks || [],
        publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      })
      .returning();

    try {
      await redis.del("cache:blogs:published:all");
    } catch {
      // Continue
    }

    return newPost;
  }

  async updateBlog(id: string, input: UpdateBlogInput) {
    const existing = await db.query.blogs.findFirst({
      where: eq(blogs.id, id),
    });

    if (!existing) {
      throw new NotFoundException(`Blog post with ID '${id}' not found`);
    }

    let slug = existing.slug;
    if (input.slug && input.slug !== existing.slug) {
      slug = this.generateSlug(input.slug);
      const duplicate = await db.query.blogs.findFirst({
        where: eq(blogs.slug, slug),
      });
      if (duplicate && duplicate.id !== id) {
        slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    const readingTimeMinutes = input.content
      ? this.calculateReadingTime(input.content)
      : existing.readingTimeMinutes;

    const [updated] = await db
      .update(blogs)
      .set({
        ...input,
        slug,
        readingTimeMinutes,
        updatedAt: new Date(),
        publishedAt:
          input.status === "PUBLISHED" && !existing.publishedAt
            ? new Date()
            : existing.publishedAt,
      })
      .where(eq(blogs.id, id))
      .returning();

    try {
      await redis.del("cache:blogs:published:all");
    } catch {
      // Continue
    }

    return updated;
  }

  async deleteBlog(id: string) {
    const [deleted] = await db.delete(blogs).where(eq(blogs.id, id)).returning();
    if (!deleted) {
      throw new NotFoundException(`Blog post with ID '${id}' not found`);
    }

    try {
      await redis.del("cache:blogs:published:all");
    } catch {
      // Continue
    }

    return { success: true, message: "Blog post deleted successfully", id };
  }

  async getPublishedBlogs(params: {
    category?: string;
    tag?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 12;
    const offset = (page - 1) * limit;

    const conditions = [eq(blogs.status, "PUBLISHED")];

    if (params.category) {
      conditions.push(eq(blogs.category, params.category));
    }

    if (params.search) {
      conditions.push(ilike(blogs.title, `%${params.search}%`));
    }

    const items = await db.query.blogs.findMany({
      where: and(...conditions),
      orderBy: [desc(blogs.createdAt)],
      limit,
      offset,
    });

    return {
      items,
      page,
      limit,
      count: items.length,
    };
  }

  async getBlogBySlug(slug: string) {
    const post = await db.query.blogs.findFirst({
      where: eq(blogs.slug, slug),
    });

    if (!post) {
      throw new NotFoundException(`Article with slug '${slug}' not found`);
    }

    // Increment view count asynchronously
    db.update(blogs)
      .set({ viewCount: sql`${blogs.viewCount} + 1` })
      .where(eq(blogs.id, post.id))
      .catch((err) => console.warn(`[BLOG VIEW COUNT ERROR]:`, err.message));

    // Generate Schema.org JSON-LD Article metadata for Google Search Engine indexing
    const schemaOrgJsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.metaDescription || post.excerpt,
      image: post.featuredImage ? [post.featuredImage] : undefined,
      author: {
        "@type": "Person",
        name: post.authorName,
      },
      publisher: {
        "@type": "Organization",
        name: "The Solusation BD",
        logo: {
          "@type": "ImageObject",
          url: "https://thesolusationbd.com/images/logo-light.png",
        },
      },
      datePublished: post.publishedAt || post.createdAt,
      dateModified: post.updatedAt,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": post.canonicalUrl || `https://thesolusationbd.com/blog/${post.slug}`,
      },
    };

    return {
      ...post,
      seo: {
        metaTitle: post.metaTitle || `${post.title} | The Solusation BD`,
        metaDescription: post.metaDescription || post.excerpt,
        metaKeywords: post.metaKeywords,
        canonicalUrl: post.canonicalUrl || `https://thesolusationbd.com/blog/${post.slug}`,
        ogImage: post.ogImage || post.featuredImage,
        schemaOrgJsonLd,
      },
    };
  }

  async getAllBlogsForAdmin(page = 1, limit = 20, status?: string) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (status) {
      conditions.push(eq(blogs.status, status as BlogStatus));
    }

    const items = await db.query.blogs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(blogs.createdAt)],
      limit,
      offset,
    });

    return {
      items,
      page,
      limit,
      count: items.length,
    };
  }
}
