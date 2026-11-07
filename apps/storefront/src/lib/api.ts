import type { CompatibilitySpecs } from "@solusation/shared-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
export const API_HOST = API_BASE.replace(/\/api\/v1\/?$/, "");

export function normalizeImageUrl(url?: string | null): string {
  if (!url) return "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800";
  if (url.startsWith("/uploads/")) {
    return `${API_HOST}${url}`;
  }
  return url;
}

export interface ApiProduct {
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
  specifications: Array<{ group: string; label: string; value: string }>;
  compatibility: any;
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  parentId?: string | null;
  filterableAttributes?: string[];
  isFeaturedInMegaMenu?: boolean;
  sortOrder?: number;
}

export interface ApiSiteSettings {
  id: string;
  logoLightUrl: string;
  logoDarkUrl: string;
  contactEmail: string;
  whatsappNumber: string;
  hotlineNumber: string;
  secondaryPhone?: string;
  landlinePhone?: string;
  ceoName?: string;
  ceoDesignation?: string;
  ceoPhone?: string;
  gulshanAddress?: string;
  idbAddress?: string;
  websiteUrl?: string;
  headerNoticeText: string;
  usdToBdtRate: string;
}

export const storefrontApi = {
  // Fetch products from backend
  async getProducts(params?: { category?: string; search?: string; limit?: number; page?: number }) {
    try {
      const q = new URLSearchParams();
      if (params?.category && params.category !== "all") q.append("category", params.category);
      if (params?.search) q.append("q", params.search);
      if (params?.limit) q.append("limit", params.limit.toString());
      if (params?.page) q.append("page", params.page.toString());
      const res = await fetch(`${API_BASE}/products?${q.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn(`[STOREFRONT_API] getProducts failed HTTP ${res.status}:`, text);
        throw new Error(`Failed to fetch products: ${res.status} ${text}`);
      }
      const json = await res.json();
      return json?.data || [];
    } catch (e) {
      console.warn("[STOREFRONT_API] getProducts error:", e);
      return [];
    }
  },

  // Fetch categories & subcategories from backend
  async getCategories(): Promise<{ all: ApiCategory[]; main: ApiCategory[]; sub: ApiCategory[] }> {
    try {
      const res = await fetch(`${API_BASE}/products/categories`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch categories");
      const json = await res.json();
      const all: ApiCategory[] = json?.data || [];
      const main = all.filter((c) => !c.parentId);
      const sub = all.filter((c) => !!c.parentId);
      return { all, main, sub };
    } catch (e) {
      console.warn("[STOREFRONT_API] getCategories error:", e);
      return { all: [], main: [], sub: [] };
    }
  },

  // Fetch brands from backend
  async getBrands() {
    try {
      const res = await fetch(`${API_BASE}/products/brands`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch brands");
      const json = await res.json();
      return json?.data || [];
    } catch (e) {
      console.warn("[STOREFRONT_API] getBrands error:", e);
      return [];
    }
  },

  // Fetch site settings from backend
  async getSettings(): Promise<ApiSiteSettings | null> {
    try {
      const res = await fetch(`${API_BASE}/settings`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch settings");
      const json = await res.json();
      return json?.data || null;
    } catch (e) {
      console.warn("[STOREFRONT_API] getSettings error:", e);
      return null;
    }
  },

  // Fetch banners from backend (Hero Slider, Side Promos)
  async getBanners(type?: string): Promise<ApiBanner[]> {
    try {
      const url = type ? `${API_BASE}/banners?type=${encodeURIComponent(type)}` : `${API_BASE}/banners`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch banners");
      const json = await res.json();
      return json?.data || [];
    } catch (e) {
      console.warn("[STOREFRONT_API] getBanners error:", e);
      return [];
    }
  },

  // Fetch product by slug from backend
  async getProductBySlug(slug: string): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE}/products/${encodeURIComponent(slug)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Product not found");
      const json = await res.json();
      return json?.data || null;
    } catch (e) {
      return null;
    }
  },

  // Place customer order (supports guest checkout without login)
  async createOrder(payload: any): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      return json;
    } catch (e: any) {
      return { success: false, message: e.message || "Failed to place order" };
    }
  },

  // Customer order tracking: needs the invoice number and the mobile number on the order
  async trackOrder(orderNumber: string, phone: string): Promise<any | null> {
    try {
      const res = await fetch(
        `${API_BASE}/orders/track/${encodeURIComponent(orderNumber.trim())}?phone=${encodeURIComponent(phone.trim())}`,
        { cache: "no-store" }
      );
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data || null;
    } catch (e) {
      return null;
    }
  },

  // bKash: merchant number and whether the online gateway is enabled
  async getBkashConfig(): Promise<{ success: boolean; data?: { merchantNumber: string; gatewayEnabled: boolean } }> {
    try {
      const res = await fetch(`${API_BASE}/bkash/config`, { cache: "no-store" });
      return await res.json();
    } catch (e: any) {
      return { success: false };
    }
  },

  // bKash: start checkout for an order. The server decides the amount.
  async createBkashPayment(invoiceNo: string): Promise<{ success: boolean; data?: { bkashURL: string }; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/bkash/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceNo }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message || "Failed to start bKash payment" };
    }
  },

  // bKash: complete the payment after the customer returns from bKash's page
  async executeBkashPayment(paymentID: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/bkash/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentID }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message || "Failed to confirm bKash payment" };
    }
  },

  // PC Builder: every buildable product in the database, grouped by slot. Throws on failure.
  async getPcParts(): Promise<Partial<Record<string, ApiPcPart[]>>> {
    const res = await fetch(`${API_BASE}/pc-builder/parts`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Could not load components (HTTP ${res.status})`);
    return (await res.json()).data ?? {};
  },

  // PC Builder: server estimates for the current build
  async validatePcBuild(components: Record<string, string>): Promise<ApiPcValidation | null> {
    try {
      const res = await fetch(`${API_BASE}/pc-builder/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ components }),
      });
      if (!res.ok) return null;
      return (await res.json()).data ?? null;
    } catch {
      return null;
    }
  },

  // PC Builder: save the build and get a short code for its share link
  async savePcBuild(components: Record<string, string>): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE}/pc-builder/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ components }),
      });
      if (!res.ok) return null;
      return (await res.json()).shortCode ?? null;
    } catch {
      return null;
    }
  },

  // PC Builder: slot -> product id for a shared build
  async getSharedPcBuild(shortCode: string): Promise<Record<string, string> | null> {
    try {
      const res = await fetch(`${API_BASE}/pc-builder/share/${encodeURIComponent(shortCode)}`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      return (await res.json()).data?.components ?? null;
    } catch {
      return null;
    }
  },

  // Tech Blogs & SEO Guides
  async getBlogs(params?: { category?: string; search?: string; page?: number; limit?: number }) {
    try {
      const q = new URLSearchParams();
      if (params?.category) q.append("category", params.category);
      if (params?.search) q.append("search", params.search);
      if (params?.page) q.append("page", params.page.toString());
      if (params?.limit) q.append("limit", params.limit.toString());
      const res = await fetch(`${API_BASE}/blogs?${q.toString()}`, { cache: "no-store" });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getBlogBySlug(slug: string) {
    try {
      const res = await fetch(`${API_BASE}/blogs/${encodeURIComponent(slug)}`, { cache: "no-store" });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};

export interface ApiPcPart {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string | null;
  cashPriceBdt: number;
  regularPriceBdt: number;
  stockStatus: ApiProduct["stockStatus"];
  totalStock: number;
  image: string | null;
  keyFeatures: string[];
  warrantyDurationMonths: number;
  compatibility: CompatibilitySpecs;
}

export interface ApiPcValidation {
  estimatedFps: Array<{
    gameTitle: string;
    resolution: string;
    preset: string;
    averageFps: number;
    experienceRating: "playable" | "smooth" | "competitive" | "ultra";
  }>;
}

export interface ApiBanner {
  id: string;
  type: string;
  tag?: string | null;
  title: string;
  subtitle?: string | null;
  image: string;
  buttonText?: string | null;
  buttonLink?: string | null;
  bgGradient?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
