import { Injectable, OnModuleInit } from "@nestjs/common";
import { typesenseClient } from "../../config/typesense";
import { redis } from "../../config/redis";
import { db, products, eq } from "@solusation/database";
import {
  ProductSearchQuery,
  SearchProductsResponse,
  TypesenseProductDocument,
} from "@solusation/shared-types";
import { CollectionCreateSchema } from "typesense/lib/Typesense/Collections";

const PRODUCTS_COLLECTION = "products";

@Injectable()
export class SearchService implements OnModuleInit {
  async onModuleInit() {
    await this.initCollection();
    // Non-blocking background sync
    this.syncAllProducts().catch((err) => {
      console.warn(`[SEARCH] Background sync notice: ${err.message}`);
    });
  }

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

    const totalStock = Array.isArray(product.branchInventory)
      ? product.branchInventory.reduce((acc: number, bi: any) => acc + (bi.stockQuantity || 0), 0)
      : 50;

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
      stockStatus: product.stockStatus || "IN_STOCK",
      totalStock,
      isEmiAvailable: Boolean(product.isEmiAvailable),
      images: Array.isArray(product.images) ? product.images : [],
      keyFeatures: Array.isArray(product.keyFeatures) ? product.keyFeatures : [],
      specFacets,
      componentType: product.compatibility?.componentType || null,
      socket: product.compatibility?.socket || null,
      supportedRam: product.compatibility?.supportedRam || null,
      tdpWatts: product.compatibility?.tdpWatts || null,
      formFactor: product.compatibility?.formFactor || null,
      psuWattage: product.compatibility?.psuWattage || null,
      benchmarkScore: product.compatibility?.benchmarkScore || 0,
      createdAt: Math.floor(new Date(product.createdAt).getTime() / 1000),
    };
  }

  async syncAllProducts(): Promise<{ success: boolean; count: number }> {
    try {
      const allProducts = await db.query.products.findMany({
        with: {
          brand: true,
          category: true,
          branchInventory: true,
        },
      });

      if (!allProducts || allProducts.length === 0) {
        return { success: true, count: 0 };
      }

      const docs = allProducts.map((p) => this.formatDocument(p));
      await typesenseClient
        .collections(PRODUCTS_COLLECTION)
        .documents()
        .import(docs, { action: "upsert" });

      return { success: true, count: docs.length };
    } catch (error) {
      console.warn(`[TYPESENSE] syncAllProducts notice:`, (error as Error).message);
      return { success: false, count: 0 };
    }
  }

  async search(query: ProductSearchQuery): Promise<SearchProductsResponse> {
    const startTime = Date.now();
    const q = query.q ? query.q.trim() : "*";
    const page = query.page || 1;
    const anyQuery = query as any;
    const perPage = anyQuery.per_page || anyQuery.perPage || 20;

    // Fast Fallback to PostgreSQL
    try {
      const filterByParts: string[] = [];
      if (anyQuery.category) filterByParts.push(`categorySlug:=${anyQuery.category}`);
      if (anyQuery.brand) filterByParts.push(`brandName:=[${anyQuery.brand.split(",").join(",")}]`);
      if (anyQuery.minPrice !== undefined) filterByParts.push(`cashPriceBdt:>=${anyQuery.minPrice}`);
      if (anyQuery.maxPrice !== undefined) filterByParts.push(`cashPriceBdt:<=${anyQuery.maxPrice}`);
      if (anyQuery.stockStatus) filterByParts.push(`stockStatus:=${anyQuery.stockStatus}`);
      if (anyQuery.socket) filterByParts.push(`socket:=${anyQuery.socket}`);
      if (anyQuery.supportedRam) filterByParts.push(`supportedRam:=${anyQuery.supportedRam}`);
      if (anyQuery.formFactor) filterByParts.push(`formFactor:=${anyQuery.formFactor}`);

      const searchParameters = {
        q: q === "" ? "*" : q,
        query_by: anyQuery.query_by || "name,sku,brandName,categoryName,specFacets",
        filter_by: filterByParts.length > 0 ? filterByParts.join(" && ") : undefined,
        page,
        per_page: perPage,
        sort_by: anyQuery.sort_by || anyQuery.sortBy || "cashPriceBdt:asc",
        facet_by: "brandName,categorySlug,stockStatus,socket,supportedRam,formFactor",
      };

      const result = await typesenseClient
        .collections(PRODUCTS_COLLECTION)
        .documents()
        .search(searchParameters);

      const hits = (result.hits || []).map((h: any) => h.document as TypesenseProductDocument);
      return {
        hits,
        found: result.found || 0,
        page: result.page || 1,
        totalPages: Math.ceil((result.found || 0) / perPage),
        facetCounts: (result.facet_counts as any) || {},
        searchTimeMs: Date.now() - startTime,
      };
    } catch {
      // Fallback query directly against PostgreSQL database
      const fallbackList = await db.query.products.findMany({
        limit: perPage,
        offset: (page - 1) * perPage,
        with: { brand: true, category: true, branchInventory: true },
      });

      const hits = fallbackList.map((p) => this.formatDocument(p));
      return {
        hits,
        found: hits.length,
        page,
        totalPages: 1,
        facetCounts: {},
        searchTimeMs: Date.now() - startTime,
      };
    }
  }
}
