import { normalizeImageUrl } from "./api";

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  categorySlug: string;
  categoryName: string;
  cashPriceBdt: number;
  regularPriceBdt: number;
  costPriceBdt?: number;
  isEmiAvailable: boolean;
  totalStock: number;
  stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "UPCOMING" | "PRE_ORDER" | "CALL_FOR_PRICE";
  thumbnailUrl: string;
  images: string[];
  keyFeatures: string[];
  warrantyDurationMonths: number;
  warrantyNotice: string;
  videoUrl?: string | null;
  branchStocks: Record<string, number>;
  specifications: Array<{ group: string; label: string; value: string }>;
  compatibility: {
    componentType: "CPU" | "MOBO" | "RAM" | "GPU" | "STORAGE" | "PSU" | "CASE" | "COOLER" | "MONITOR" | "OTHER";
    socket?: string | null;
    supportedRam?: string | null;
    tdpWatts?: number;
    formFactor?: string | null;
    psuWattage?: number | null;
    benchmarkScore?: number;
  };
}

/** Converts an API product to what the pages render. Missing data stays missing, never invented. */
export function normalizeProduct(raw: any): Product {
  const images: string[] =
    Array.isArray(raw.images) && raw.images.length > 0
      ? raw.images.map((image: string) => normalizeImageUrl(image))
      : [normalizeImageUrl(raw.thumbnailUrl)];
  const warrantyMonths = Number(raw.warrantyDurationMonths) || 0;

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    sku: raw.sku || "",
    brand: raw.brand?.name || (typeof raw.brand === "string" ? raw.brand : "") || "",
    categorySlug: raw.category?.slug || "",
    categoryName: raw.category?.name || "Components",
    cashPriceBdt: Number(raw.cashPriceBdt) || 0,
    regularPriceBdt: Number(raw.regularPriceBdt) || Number(raw.cashPriceBdt) || 0,
    costPriceBdt: Number(raw.costPriceBdt) || 0,
    isEmiAvailable: Boolean(raw.isEmiAvailable),
    totalStock: Number(raw.totalStock) || 0,
    stockStatus: raw.stockStatus || "OUT_OF_STOCK",
    thumbnailUrl: images[0],
    images,
    keyFeatures: raw.keyFeatures || [],
    warrantyDurationMonths: warrantyMonths,
    warrantyNotice: raw.warrantyTerms || (warrantyMonths ? `${warrantyMonths} Months Official Warranty` : ""),
    videoUrl: raw.videoUrl || null,
    branchStocks: Object.fromEntries(
      (raw.branchInventory ?? []).map((row: { branchCode: string; stock: number }) => [row.branchCode, row.stock])
    ),
    specifications: raw.specifications || [],
    compatibility: raw.compatibility || { componentType: "OTHER" },
  };
}

/** Whether this product can be added to a cart right now. */
export function canOrder(product: Pick<Product, "stockStatus" | "totalStock">): boolean {
  if (product.stockStatus === "PRE_ORDER") return true;
  return product.stockStatus === "IN_STOCK" && product.totalStock > 0;
}

export const STOCK_LABELS: Record<Product["stockStatus"], string> = {
  IN_STOCK: "In stock",
  OUT_OF_STOCK: "Out of stock",
  UPCOMING: "Coming soon",
  PRE_ORDER: "Pre-order",
  CALL_FOR_PRICE: "Call for price",
};
