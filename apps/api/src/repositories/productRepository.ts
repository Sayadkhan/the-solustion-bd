import { db, products, eq, desc, and, or, ilike } from "@solusation/database";

export type ProductEntity = typeof products.$inferSelect;

export class ProductRepository {
  async findAll(limit = 20, offset = 0, search?: string): Promise<any[]> {
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      return db.query.products.findMany({
        where: or(
          ilike(products.name, term),
          ilike(products.sku, term)
        ),
        with: {
          brand: true,
          category: true,
        },
        orderBy: desc(products.createdAt),
        limit,
        offset,
      });
    }

    return db.query.products.findMany({
      with: {
        brand: true,
        category: true,
      },
      orderBy: desc(products.createdAt),
      limit,
      offset,
    });
  }

  async findBySlug(slug: string): Promise<any | null> {
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

  async findById(id: string): Promise<any | null> {
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

  async findByCategory(categorySlugOrId: string, limit = 20, search?: string): Promise<any[]> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categorySlugOrId);
    const cat = await db.query.categories.findFirst({
      where: isUuid
        ? (c, { eq, or }) => or(eq(c.slug, categorySlugOrId), eq(c.id, categorySlugOrId))
        : (c, { eq }) => eq(c.slug, categorySlugOrId),
    });

    if (!cat && !isUuid) {
      return [];
    }

    const targetCatId = cat ? cat.id : categorySlugOrId;
    const catCondition = eq(products.categoryId, targetCatId);

    const condition = search && search.trim()
      ? and(
          catCondition,
          or(
            ilike(products.name, `%${search.trim()}%`),
            ilike(products.sku, `%${search.trim()}%`)
          )
        )
      : catCondition;

    return db.query.products.findMany({
      where: condition,
      with: {
        brand: true,
        category: true,
      },
      orderBy: desc(products.createdAt),
      limit,
    });
  }

  async findFeatured(limit = 10): Promise<any[]> {
    return db.query.products.findMany({
      with: {
        brand: true,
        category: true,
      },
      orderBy: desc(products.createdAt),
      limit,
    });
  }
}

export const productRepository = new ProductRepository();
