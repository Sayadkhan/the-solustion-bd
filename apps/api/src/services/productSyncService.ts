import { typesenseClient } from "../config/typesense";
import { redis } from "../config/redis";
import { db, products, eq } from "@solusation/database";
import {
  ProductSearchQuery,
  SearchProductsResponse,
  TypesenseProductDocument,
} from "@solusation/shared-types";
import { CollectionCreateSchema } from "typesense/lib/Typesense/Collections";

const PRODUCTS_COLLECTION = "products";

export class ProductSyncService {
  async initCollection(): Promise<void> {
    try {
      const collections = await typesenseClient.collections().retrieve();
      const exists = collections.some((c) => c.name === PRODUCTS_COLLECTION);

      if (!exists) {
        const schema: CollectionCreateSchema = {
          name: PRODUCTS_COLLECTION,
          fields: [
            { name: "id", type: "string" },
            { name: "sku", type: "string", facet: false },
            { name: "name", type: "string", facet: false },
            { name: "slug", type: "string", facet: false },
            { name: "brandName", type: "string", facet: true },
            { name: "categorySlug", type: "string", facet: true },
            { name: "categoryName", type: "string", facet: true },
            { name: "cashPriceBdt", type: "int32", facet: true },
            { name: "regularPriceBdt", type: "int32", facet: true },
            { name: "stockStatus", type: "string", facet: true },
            { name: "totalStock", type: "int32", facet: false },
            { name: "isEmiAvailable", type: "bool", facet: true },
            { name: "specFacets", type: "string[]", facet: true },
            { name: "componentType", type: "string", facet: true, optional: true },
            { name: "socket", type: "string", facet: true, optional: true },
            { name: "supportedRam", type: "string", facet: true, optional: true },
            { name: "tdpWatts", type: "int32", facet: false, optional: true },
            { name: "formFactor", type: "string", facet: true, optional: true },
            { name: "psuWattage", type: "int32", facet: false, optional: true },
            { name: "benchmarkScore", type: "int32", facet: false, optional: true },
            { name: "createdAt", type: "int64", facet: false },
          ],
          default_sorting_field: "cashPriceBdt",
        };

        await typesenseClient.collections().create(schema);
        console.log(`[TYPESENSE] ✅ Initialized collection '${PRODUCTS_COLLECTION}'`);
      }
    } catch (error) {
      console.warn(`[TYPESENSE] Warning initializing collection:`, (error as Error).message);
    }
  }

  formatDocument(product: any): TypesenseProductDocument {
    const specFacets: string[] = [];
    if (Array.isArray(product.specifications)) {
      for (const spec of product.specifications) {
        if (spec.label && spec.value) {
          specFacets.push(`${spec.label}: ${spec.value}`);
        }
      }
    }

    const comp = product.compatibility || {};

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      brandName: product.brand?.name || "Generic",
      categorySlug: product.category?.slug || "general",
      categoryName: product.category?.name || "General",
      cashPriceBdt: product.cashPriceBdt,
      regularPriceBdt: product.regularPriceBdt,
      stockStatus: product.stockStatus,
      totalStock: product.totalStock,
      isEmiAvailable: product.isEmiAvailable,
      images: Array.isArray(product.images) ? product.images : [],
      keyFeatures: Array.isArray(product.keyFeatures) ? product.keyFeatures : [],
      specFacets,
      componentType: comp.componentType || null,
      socket: comp.socket || null,
      supportedRam: comp.supportedRam || null,
      tdpWatts: comp.tdpWatts || 0,
      formFactor: comp.formFactor || null,
      psuWattage: comp.psuWattage || null,
      benchmarkScore: comp.benchmarkScore || 0,
      createdAt: Math.floor(new Date(product.createdAt).getTime() / 1000),
    };
  }

  async syncProductById(productId: string): Promise<void> {
    try {
      const product = await db.query.products.findFirst({
        where: eq(products.id, productId),
        with: {
          brand: true,
          category: true,
          branchInventory: true,
        },
      });

      if (!product) return;

      const doc = this.formatDocument(product);
      await typesenseClient.collections(PRODUCTS_COLLECTION).documents().upsert(doc);

      // Invalidate Redis caches
      try {
        const keys = await redis.keys("cache:search:*");
        if (keys.length > 0) {
          await redis.del(...keys);
        }
        await redis.del(`cache:product:${product.slug}`);
        await redis.del(`cache:product:${product.id}`);
      } catch {
        // Degraded Redis
      }
    } catch (error) {
      console.warn(`[TYPESENSE] Failed to sync product ${productId}:`, (error as Error).message);
    }
  }

  async syncAllProducts(): Promise<{ count: number; success: boolean }> {
    try {
      await this.initCollection();

      const allProducts = await db.query.products.findMany({
        with: {
          brand: true,
          category: true,
          branchInventory: true,
        },
      });

      if (allProducts.length === 0) {
        return { count: 0, success: true };
      }

      const docs = allProducts.map((p) => this.formatDocument(p));
      await typesenseClient
        .collections(PRODUCTS_COLLECTION)
        .documents()
        .import(docs, { action: "upsert" });

      console.log(`[TYPESENSE] 🚀 Synced ${docs.length} products into Typesense collection.`);

      // Clear search cache in Redis
      try {
        const keys = await redis.keys("cache:search:*");
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch {
        // Ignore
      }

      return { count: docs.length, success: true };
    } catch (error) {
      console.warn(`[TYPESENSE] syncAllProducts error:`, (error as Error).message);
      return { count: 0, success: false };
    }
  }

  async search(query: ProductSearchQuery): Promise<SearchProductsResponse> {
    const startTime = Date.now();
    const cacheKey = `cache:search:${JSON.stringify(query)}`;

    // Try Redis cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.searchTimeMs = Date.now() - startTime;
        return parsed;
      }
    } catch {
      // Degraded fallback
    }

    // Build filter expressions
    const filterClauses: string[] = [];

    if (query.minPrice !== undefined && query.maxPrice !== undefined) {
      filterClauses.push(`cashPriceBdt:[${query.minPrice}..${query.maxPrice}]`);
    } else if (query.minPrice !== undefined) {
      filterClauses.push(`cashPriceBdt:>=${query.minPrice}`);
    } else if (query.maxPrice !== undefined) {
      filterClauses.push(`cashPriceBdt:<=${query.maxPrice}`);
    }

    if (query.category) {
      filterClauses.push(`categorySlug:=${query.category}`);
    }

    if (query.brand) {
      filterClauses.push(`brandName:=${query.brand}`);
    }

    if (query.inStockOnly) {
      filterClauses.push(`stockStatus:=[IN_STOCK]`);
    }

    if (query.filter_by) {
      filterClauses.push(query.filter_by);
    }

    const filter_by = filterClauses.length > 0 ? filterClauses.join(" && ") : undefined;

    try {
      const searchParams = {
        q: query.q || "*",
        query_by: query.query_by || "name,sku,brandName,categorySlug,specFacets",
        filter_by,
        sort_by: query.sort_by || "cashPriceBdt:asc",
        facet_by: query.facet_by || "brandName,categorySlug,stockStatus,specFacets,socket,supportedRam,formFactor",
        page: query.page || 1,
        per_page: query.per_page || 20,
      };

      const result = await typesenseClient
        .collections(PRODUCTS_COLLECTION)
        .documents()
        .search(searchParams);

      const facetCounts: Record<string, { value: string; count: number }[]> = {};
      if (result.facet_counts) {
        for (const f of result.facet_counts) {
          facetCounts[f.field_name] = f.counts.map((c) => ({
            value: c.value,
            count: c.count,
          }));
        }
      }

      const hits = (result.hits || []).map((h) => h.document as TypesenseProductDocument);
      const totalHits = result.found || 0;
      const totalPages = Math.ceil(totalHits / (query.per_page || 20));
      const searchTimeMs = Date.now() - startTime;

      const response: SearchProductsResponse = {
        hits,
        found: totalHits,
        page: query.page || 1,
        totalPages,
        facetCounts,
        searchTimeMs,
      };

      // Cache for 60 seconds in Redis for sub-5ms repeat responses
      try {
        await redis.set(cacheKey, JSON.stringify(response), "EX", 60);
      } catch {
        // Degraded fallback
      }

      return response;
    } catch (error) {
      // If Typesense is empty or unreachable during dev, fallback to PostgreSQL search
      console.warn(`[TYPESENSE SEARCH FALLBACK] Fallback to PostgreSQL due to: ${(error as Error).message}`);

      const pgHits = await db.query.products.findMany({
        limit: query.per_page || 20,
        offset: ((query.page || 1) - 1) * (query.per_page || 20),
        with: {
          brand: true,
          category: true,
        },
      });

      return {
        hits: pgHits.map((p) => this.formatDocument(p)),
        found: pgHits.length,
        page: query.page || 1,
        totalPages: 1,
        facetCounts: {},
        searchTimeMs: Date.now() - startTime,
      };
    }
  }
}

export const productSyncService = new ProductSyncService();
