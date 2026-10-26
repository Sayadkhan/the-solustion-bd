import { db, products, eq, desc, and } from "@solusation/database";

export type ProductEntity = typeof products.$inferSelect;

export class ProductRepository {
  async findAll(limit = 20, offset = 0): Promise<ProductEntity[]> {
    return db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findBySlug(slug: string): Promise<ProductEntity | null> {
    const result = await db.query.products.findFirst({
      where: eq(products.slug, slug),
      with: {
        branchInventory: true,
        brand: true,
        category: true,
      },
    });
    return result || null;
  }

  async findById(id: string): Promise<ProductEntity | null> {
    const result = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        branchInventory: true,
        brand: true,
        category: true,
      },
    });
    return result || null;
  }

  async findByCategory(categoryId: string, limit = 20): Promise<ProductEntity[]> {
    return db
      .select()
      .from(products)
      .where(eq(products.categoryId, categoryId))
      .orderBy(desc(products.createdAt))
      .limit(limit);
  }

  async findFeatured(limit = 10): Promise<ProductEntity[]> {
    return db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt))
      .limit(limit);
  }
}

export const productRepository = new ProductRepository();
