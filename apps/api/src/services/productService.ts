import { productRepository } from "../repositories/productRepository";
import { redis } from "../config/redis";
import { formatBdt } from "@solusation/shared-types";

export class ProductService {
  async getFeaturedProducts() {
    const cacheKey = "cache:products:featured";
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Degraded without redis
    }

    const products = await productRepository.findFeatured(12);
    const enriched = products.map((p) => ({
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
    if (!product) return null;

    return {
      ...product,
      formattedCashPrice: formatBdt(product.cashPriceBdt),
      formattedRegularPrice: formatBdt(product.regularPriceBdt),
      cashDiscountBdt: product.regularPriceBdt - product.cashPriceBdt,
    };
  }

  async getProducts(categorySlug?: string, limit = 24, page = 1) {
    const offset = (page - 1) * limit;
    const products = categorySlug
      ? await productRepository.findByCategory(categorySlug, limit)
      : await productRepository.findAll(limit, offset);

    return products.map((p) => ({
      ...p,
      formattedCashPrice: formatBdt(p.cashPriceBdt),
      formattedRegularPrice: formatBdt(p.regularPriceBdt),
      cashDiscountBdt: p.regularPriceBdt - p.cashPriceBdt,
    }));
  }
}

export const productService = new ProductService();
