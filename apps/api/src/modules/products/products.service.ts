import { Injectable, NotFoundException } from "@nestjs/common";
import { db, products, branchInventory, categories, brands, productSerials, orderItems, eq, desc, sql } from "@solusation/database";
import { formatBdt } from "@solusation/shared-types";
import { redis } from "../../config/redis";
import { productRepository } from "../../repositories/productRepository";

@Injectable()
export class ProductsService {
  async getFeaturedProducts(limit = 12) {
    const cacheKey = "cache:products:featured";
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {
      // Degraded cache fallback
    }

    const items = await productRepository.findFeatured(limit);
    const enriched = items.map((p) => ({
      ...p,
      formattedCashPrice: formatBdt(p.cashPriceBdt),
      formattedRegularPrice: formatBdt(p.regularPriceBdt),
      cashDiscountBdt: p.regularPriceBdt - p.cashPriceBdt,
    }));

    try {
      await redis.set(cacheKey, JSON.stringify(enriched), "EX", 300);
    } catch {
      // Continue
    }

    return enriched;
  }

  async getProductBySlug(slug: string) {
    const product = await productRepository.findBySlug(slug);
    if (!product) {
      throw new NotFoundException(`Product with slug '${slug}' not found`);
    }

    return {
      ...product,
      formattedCashPrice: formatBdt(product.cashPriceBdt),
      formattedRegularPrice: formatBdt(product.regularPriceBdt),
      cashDiscountBdt: product.regularPriceBdt - product.cashPriceBdt,
    };
  }

  async getProducts(categorySlug?: string, limit = 24, page = 1) {
    const offset = (page - 1) * limit;
    const items = categorySlug
      ? await productRepository.findByCategory(categorySlug, limit)
      : await productRepository.findAll(limit, offset);

    return items.map((p) => ({
      ...p,
      formattedCashPrice: formatBdt(p.cashPriceBdt),
      formattedRegularPrice: formatBdt(p.regularPriceBdt),
      cashDiscountBdt: p.regularPriceBdt - p.cashPriceBdt,
    }));
  }

  async createProduct(data: any) {
    const [newProduct] = await db.insert(products).values(data).returning();
    
    // Add default central inventory
    await db.insert(branchInventory).values({
      productId: newProduct.id,
      branchCode: "ONLINE_WAREHOUSE",
      stock: data.initialStock || data.totalStock || 10,
    });

    try {
      await redis.del("cache:products:featured");
    } catch {
      // Continue
    }

    return newProduct;
  }

  async updateProductStock(id: string, newStock: number, status?: "IN_STOCK" | "OUT_OF_STOCK" | "UPCOMING" | "PRE_ORDER") {
    const stockStatus = status || (newStock > 0 ? "IN_STOCK" : "OUT_OF_STOCK");
    const [updated] = await db
      .update(products)
      .set({
        totalStock: newStock,
        stockStatus,
      })
      .where(eq(products.id, id))
      .returning();

    // Also update central inventory
    await db
      .update(branchInventory)
      .set({ stock: newStock })
      .where(eq(branchInventory.productId, id));

    return updated;
  }

  async deleteProduct(id: string) {
    // 1. Delete associated product serials first
    await db.delete(productSerials).where(eq(productSerials.productId, id));
    // 2. Delete branch inventory
    await db.delete(branchInventory).where(eq(branchInventory.productId, id));
    // 3. Delete order items if any
    await db.delete(orderItems).where(eq(orderItems.productId, id));
    // 4. Delete the product itself
    const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
    if (!deleted) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    // 5. Invalidate redis cache if available
    try {
      await redis.del("cache:products:featured");
    } catch {
      // ignore
    }
    return deleted;
  }

  // Categories (Star Tech Main & Sub-Category Tree ordered by serial sortOrder)
  async getCategories() {
    const allCategories = await db.select().from(categories).orderBy(categories.sortOrder, categories.name);
    // Enrich with product counts
    const counts = await db
      .select({
        categoryId: products.categoryId,
        count: sql<number>`count(*)::int`,
      })
      .from(products)
      .groupBy(products.categoryId);

    const countMap = new Map(counts.map((c) => [c.categoryId, c.count]));

    // Map by id for parent lookups
    const categoryById = new Map(allCategories.map((c) => [c.id, c]));

    const enrichedFlat = allCategories.map((cat) => {
      const parent = cat.parentId ? categoryById.get(cat.parentId) : null;
      return {
        ...cat,
        productCount: countMap.get(cat.id) || 0,
        parentName: parent ? parent.name : null,
        parentSlug: parent ? parent.slug : null,
        isMainCategory: !cat.parentId,
      };
    });

    // Build Star Tech Tree
    const mainCategories = enrichedFlat
      .filter((c) => c.isMainCategory)
      .map((mainCat) => {
        const children = enrichedFlat.filter((c) => c.parentId === mainCat.id);
        const childrenProductsCount = children.reduce((acc, ch) => acc + (ch.productCount || 0), 0);
        return {
          ...mainCat,
          subCategories: children,
          hasSubCategories: children.length > 0,
          totalProductCount: (mainCat.productCount || 0) + childrenProductsCount,
        };
      });

    return {
      flat: enrichedFlat,
      mainCategories,
    };
  }

  async createCategory(data: {
    name: string;
    slug: string;
    icon?: string;
    filterableAttributes?: string[];
    isFeaturedInMegaMenu?: boolean;
    parentId?: string | null;
    sortOrder?: number;
  }) {
    const payload = {
      ...data,
      parentId: data.parentId || null,
      sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
    };
    const [cat] = await db.insert(categories).values(payload).returning();
    return cat;
  }

  async updateCategorySortOrder(id: string, sortOrder: number) {
    const [updated] = await db
      .update(categories)
      .set({ sortOrder: Number(sortOrder) })
      .where(eq(categories.id, id))
      .returning();
    return updated;
  }

  async reorderCategories(orders: Array<{ id: string; sortOrder: number }>) {
    const updated = [];
    for (const item of orders) {
      const [res] = await db
        .update(categories)
        .set({ sortOrder: Number(item.sortOrder) })
        .where(eq(categories.id, item.id))
        .returning();
      if (res) updated.push(res);
    }
    return updated;
  }

  async deleteCategory(id: string) {
    // 1. Unlink any children sub-categories first
    await db.update(categories).set({ parentId: null }).where(eq(categories.parentId, id));
    // 2. Unlink any products assigned to this category
    await db.update(products).set({ categoryId: null }).where(eq(products.categoryId, id));
    // 3. Delete the category
    const [cat] = await db.delete(categories).where(eq(categories.id, id)).returning();
    return cat;
  }

  // Brands
  async getBrands() {
    return await db.select().from(brands).orderBy(brands.name);
  }

  async createBrand(data: { name: string; slug: string; logoUrl?: string }) {
    const [brand] = await db.insert(brands).values(data).returning();
    return brand;
  }

  async deleteBrand(id: string) {
    // Unlink any products assigned to this brand first
    await db.update(products).set({ brandId: null }).where(eq(products.brandId, id));
    const [brand] = await db.delete(brands).where(eq(brands.id, id)).returning();
    return brand;
  }
}

