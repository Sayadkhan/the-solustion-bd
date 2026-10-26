import { z } from "zod";

export const ProductSearchQuerySchema = z.object({
  q: z.string().optional().default("*"),
  query_by: z.string().optional().default("name,sku,brandName,categorySlug,specFacets"),
  filter_by: z.string().optional(),
  sort_by: z.string().optional().default("cashPriceBdt:asc"),
  facet_by: z.string().optional().default("brandName,categorySlug,stockStatus,specFacets"),
  page: z.coerce.number().int().positive().optional().default(1),
  per_page: z.coerce.number().int().positive().max(100).optional().default(20),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  inStockOnly: z.coerce.boolean().optional(),
});
export type ProductSearchQuery = z.infer<typeof ProductSearchQuerySchema>;

export interface TypesenseProductDocument {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brandName: string;
  categorySlug: string;
  categoryName: string;
  cashPriceBdt: number;
  regularPriceBdt: number;
  stockStatus: string;
  totalStock: number;
  isEmiAvailable: boolean;
  images: string[];
  keyFeatures: string[];
  specFacets: string[]; // e.g. ["Socket: AM5", "Supported RAM: DDR5", "Series: Ryzen 7"]
  componentType?: string | null;
  socket?: string | null;
  supportedRam?: string | null;
  tdpWatts?: number;
  formFactor?: string | null;
  psuWattage?: number | null;
  benchmarkScore?: number;
  compatibility?: {
    componentType: string;
    socket?: string | null;
    supportedRam?: string | null;
    tdpWatts?: number;
    formFactor?: string | null;
    psuWattage?: number | null;
    benchmarkScore?: number;
  } | null;
  createdAt: number; // Unix timestamp for Typesense sorting
}

export interface SearchFacetCount {
  value: string;
  count: number;
  highlighted?: string;
}

export interface SearchFacetResult {
  fieldName: string;
  counts: SearchFacetCount[];
}

export interface SearchProductsResponse {
  hits: TypesenseProductDocument[];
  found: number;
  page: number;
  totalPages: number;
  facetCounts: Record<string, SearchFacetCount[]>;
  searchTimeMs: number;
}
