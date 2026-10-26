const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  items?: T[];
  [key: string]: any;
}

export const adminApi = {
  // Products
  async getProducts(params?: { category?: string; limit?: number; page?: number }) {
    try {
      const q = new URLSearchParams();
      if (params?.category) q.append("category", params.category);
      if (params?.limit) q.append("limit", params.limit.toString());
      if (params?.page) q.append("page", params.page.toString());
      const res = await fetch(`${API_BASE}/products?${q.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return await res.json();
    } catch {
      return null;
    }
  },

  async createProduct(payload: any) {
    const res = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  // Orders
  async getOrders(params?: { limit?: number; page?: number }) {
    try {
      const q = new URLSearchParams();
      if (params?.limit) q.append("limit", params.limit.toString());
      if (params?.page) q.append("page", params.page.toString());
      const res = await fetch(`${API_BASE}/orders?${q.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateOrderStatus(orderNumber: string, status: string) {
    const res = await fetch(`${API_BASE}/orders/${orderNumber}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return await res.json();
  },

  async verifyOrderDeposit(orderNumber: string, trxId: string, amount: number) {
    const res = await fetch(`${API_BASE}/orders/${orderNumber}/deposit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trxId, amount }),
    });
    return await res.json();
  },

  // Warranty Serials
  async lookupWarranty(serialNumber: string) {
    const res = await fetch(`${API_BASE}/serials/warranty/${encodeURIComponent(serialNumber)}`);
    return await res.json();
  },

  async registerSerial(payload: {
    serialNumber: string;
    productId: string;
    supplierName: string;
    warrantyExpiresAt?: string;
  }) {
    const res = await fetch(`${API_BASE}/serials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  // Blogs & SEO
  async getBlogs(params?: { category?: string; search?: string }) {
    try {
      const q = new URLSearchParams();
      if (params?.category) q.append("category", params.category);
      if (params?.search) q.append("search", params.search);
      const res = await fetch(`${API_BASE}/blogs?${q.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch blogs");
      return await res.json();
    } catch {
      return null;
    }
  },

  async createBlog(payload: any) {
    const res = await fetch(`${API_BASE}/blogs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async deleteBlog(id: string) {
    const res = await fetch(`${API_BASE}/blogs/${id}`, {
      method: "DELETE",
    });
    return await res.json();
  },

  // Inquiries
  // Product Actions
  async updateProductStock(id: string, stock: number, status?: string) {
    const res = await fetch(`${API_BASE}/products/${id}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock, status }),
    });
    return await res.json();
  },

  async deleteProduct(id: string) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: "DELETE",
    });
    return await res.json();
  },

  // Categories
  async getCategories() {
    try {
      const res = await fetch(`${API_BASE}/products/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return await res.json();
    } catch {
      return null;
    }
  },

  async createCategory(payload: {
    name: string;
    slug: string;
    icon?: string;
    filterableAttributes?: string[];
    isFeaturedInMegaMenu?: boolean;
    parentId?: string | null;
    sortOrder?: number;
  }) {
    const res = await fetch(`${API_BASE}/products/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async deleteCategory(id: string) {
    const res = await fetch(`${API_BASE}/products/categories/${id}`, {
      method: "DELETE",
    });
    return await res.json();
  },

  async updateCategorySortOrder(id: string, sortOrder: number) {
    const res = await fetch(`${API_BASE}/products/categories/${id}/sort-order`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sortOrder }),
    });
    return await res.json();
  },

  async reorderCategories(orders: Array<{ id: string; sortOrder: number }>) {
    const res = await fetch(`${API_BASE}/products/categories/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders }),
    });
    return await res.json();
  },

  // Brands
  async getBrands() {
    try {
      const res = await fetch(`${API_BASE}/products/brands`);
      if (!res.ok) throw new Error("Failed to fetch brands");
      return await res.json();
    } catch {
      return null;
    }
  },

  async createBrand(payload: { name: string; slug: string; logoUrl?: string }) {
    const res = await fetch(`${API_BASE}/products/brands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async deleteBrand(id: string) {
    const res = await fetch(`${API_BASE}/products/brands/${id}`, {
      method: "DELETE",
    });
    return await res.json();
  },

  // Serials
  async getSerials() {
    try {
      const res = await fetch(`${API_BASE}/serials`);
      if (!res.ok) throw new Error("Failed to fetch serials");
      return await res.json();
    } catch {
      return null;
    }
  },

  // Inquiries
  async getInquiries() {
    try {
      const res = await fetch(`${API_BASE}/settings/inquiries`);
      if (!res.ok) throw new Error("Failed to fetch inquiries");
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateInquiryStatus(id: string, status: "PENDING" | "CONTACTED" | "RESOLVED" | "ARCHIVED") {
    const res = await fetch(`${API_BASE}/settings/inquiries/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return await res.json();
  },

  // Settings
  async getSettings() {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (!res.ok) throw new Error("Failed to fetch settings");
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateSettings(payload: any) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  // Image Upload
  async uploadImage(file: File, folder = "products"): Promise<{ url: string; success: boolean }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/upload/single?folder=${folder}`, {
      method: "POST",
      body: formData,
    });
    const json = await res.json();
    return {
      success: res.ok,
      url: json.url ? `http://localhost:4000${json.url}` : "",
    };
  },

  // Banners Management
  async getBanners(type?: string) {
    try {
      const url = type ? `${API_BASE}/banners/admin?type=${encodeURIComponent(type)}` : `${API_BASE}/banners/admin`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch banners");
      return await res.json();
    } catch {
      return null;
    }
  },

  async createBanner(payload: {
    type?: string;
    tag?: string;
    title: string;
    subtitle?: string;
    image: string;
    buttonText?: string;
    buttonLink?: string;
    bgGradient?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const res = await fetch(`${API_BASE}/banners`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async updateBanner(id: string, payload: any) {
    const res = await fetch(`${API_BASE}/banners/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async deleteBanner(id: string) {
    const res = await fetch(`${API_BASE}/banners/${id}`, {
      method: "DELETE",
    });
    return await res.json();
  },

  async reorderBanners(orders: Array<{ id: string; sortOrder: number }>) {
    const res = await fetch(`${API_BASE}/banners/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders }),
    });
    return await res.json();
  },
};

