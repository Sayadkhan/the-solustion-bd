import { Metadata } from "next";
import { storefrontApi, normalizeImageUrl } from "@/lib/api";
import { ProductDetail } from "./product-detail";

const SITE_URL = "https://thesolutionsbd.com";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await storefrontApi.getProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found | The Solutions BD", robots: { index: false } };
  }

  const description =
    product.keyFeatures?.slice(0, 3).join(", ") ||
    `Buy ${product.name} in Bangladesh with official warranty from The Solutions BD.`;
  const image = normalizeImageUrl(product.images?.[0] ?? product.thumbnailUrl);

  return {
    title: `${product.name} Price in Bangladesh | The Solutions BD`,
    description,
    alternates: { canonical: `${SITE_URL}/products/${slug}` },
    openGraph: { title: product.name, description, images: [{ url: image }] },
  };
}

const AVAILABILITY_BY_STOCK_STATUS: Record<string, string> = {
  IN_STOCK: "https://schema.org/InStock",
  OUT_OF_STOCK: "https://schema.org/OutOfStock",
  PRE_ORDER: "https://schema.org/PreOrder",
  UPCOMING: "https://schema.org/PreOrder",
};

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await storefrontApi.getProductBySlug(slug);
  const relatedProducts = product?.category?.slug
    ? await storefrontApi.getProducts({ category: product.category.slug, limit: 5 })
    : [];

  const jsonLd = product && {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    image: (product.images ?? []).map((img: string) => normalizeImageUrl(img)),
    brand: product.brand?.name ? { "@type": "Brand", name: product.brand.name } : undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${slug}`,
      priceCurrency: "BDT",
      price: product.cashPriceBdt,
      availability: AVAILABILITY_BY_STOCK_STATUS[product.stockStatus] ?? "https://schema.org/InStock",
    },
  };

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // "<" is escaped so that product text cannot close this script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      <ProductDetail slug={slug} initialProduct={product} relatedProducts={relatedProducts} />
    </>
  );
}
