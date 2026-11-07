import { MetadataRoute } from "next";
import { storefrontApi } from "@/lib/api";

// Built on request, so that new products reach search engines without a deploy.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://thesolutionsbd.com";
  const now = new Date();

  // Static core routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pc-builder`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/track-order`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/products?category=processor`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/products?category=graphics-card`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/products?category=motherboard`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
  ];

  // If the API is unreachable the core routes are still served.
  const [products, blogs] = await Promise.all([
    storefrontApi.getProducts({ limit: 200 }),
    storefrontApi.getBlogs({ limit: 100 }),
  ]);

  for (const product of products) {
    routes.push({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  for (const blog of blogs?.items ?? []) {
    routes.push({
      url: `${baseUrl}/blogs/${blog.slug}`,
      lastModified: blog.updatedAt ? new Date(blog.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return routes;
}
