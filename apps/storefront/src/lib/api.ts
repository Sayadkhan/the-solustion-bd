const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

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
      if (!res.ok) throw new Error("Failed to fetch products");
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

  // Fetch blogs from backend
  async getBlogs() {
    try {
      const res = await fetch(`${API_BASE}/blogs`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch blogs");
      const json = await res.json();
      return json?.data || [];
    } catch (e) {
      console.warn("[STOREFRONT_API] getBlogs error:", e);
      return [];
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

  // Lookup order by invoice/order number
  async getOrderByNumber(orderNumber: string): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderNumber.trim())}`, { cache: "no-store" });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data || null;
    } catch (e) {
      return null;
    }
  },

  // bKash Payment Gateway: Fetch merchant config
  async getBkashConfig(): Promise<{ success: boolean; data?: any }> {
    try {
      const res = await fetch(`${API_BASE}/bkash/config`, { cache: "no-store" });
      const json = await res.json();
      return json;
    } catch (e: any) {
      return { success: false };
    }
  },

  // bKash Payment Gateway: Create tokenized payment session
  async createBkashPayment(payload: {
    amount: number;
    invoiceNo?: string;
    customerPhone?: string;
    callbackUrl?: string;
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/bkash/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      return json;
    } catch (e: any) {
      return { success: false, message: e.message || "Failed to initiate bKash payment" };
    }
  },

  // bKash Payment Gateway: Execute payment
  async executeBkashPayment(payload: {
    paymentID: string;
    invoiceNo?: string;
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/bkash/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      return json;
    } catch (e: any) {
      return { success: false, message: e.message || "Failed to execute bKash payment" };
    }
  },

  // bKash Payment Gateway: Verify manual TrxID
  async verifyBkashTrx(trxId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/bkash/verify-trx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trxId }),
      });
      const json = await res.json();
      return json;
    } catch (e: any) {
      return { success: false, message: e.message || "Invalid bKash TrxID" };
    }
  },
};

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
