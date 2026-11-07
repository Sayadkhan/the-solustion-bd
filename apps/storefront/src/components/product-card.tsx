"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GitCompare, ShoppingCart } from "lucide-react";
import { formatBdt } from "@solusation/shared-types";
import { useCartStore } from "@/stores/cart-store";
import { useCompareStore } from "@/stores/compare-store";
import { canOrder, Product, STOCK_LABELS } from "@/lib/product";

interface ProductCardProps {
  product: Product;
  viewMode?: "grid" | "list";
}

export function ProductCard({ product, viewMode = "grid" }: ProductCardProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const { addComponent, isSelected } = useCompareStore();
  const compared = isSelected(product.id);
  const orderable = canOrder(product);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  // An image served from cache can finish before its load handler is attached.
  const imageRef = React.useCallback((image: HTMLImageElement | null) => {
    if (image?.complete) setImageLoaded(true);
  }, []);

  const discountPercent =
    product.regularPriceBdt > product.cashPriceBdt
      ? Math.round(((product.regularPriceBdt - product.cashPriceBdt) / product.regularPriceBdt) * 100)
      : 0;

  const addToCart = () =>
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      slug: product.slug,
      cashPriceBdt: product.cashPriceBdt,
      regularPriceBdt: product.regularPriceBdt,
      thumbnailUrl: product.thumbnailUrl,
      pricingType: "CASH",
    });

  const handleCompare = () =>
    addComponent({
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      sku: product.sku,
      cashPriceBdt: product.cashPriceBdt,
      regularPriceBdt: product.regularPriceBdt,
      thumbnailUrl: product.thumbnailUrl,
      categorySlug: product.categorySlug,
      specs: product.compatibility as any,
    });

  const image = (
    <>
      {!imageLoaded && <div className="absolute inset-0 bg-slate-100 animate-pulse" />}
      <img
        ref={imageRef}
        src={product.thumbnailUrl}
        alt={product.name}
        loading="lazy"
        onLoad={() => setImageLoaded(true)}
        className={`w-full h-full object-contain transition-all duration-300 group-hover:scale-[1.03] ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
      {discountPercent > 0 && (
        <span className="absolute top-2 left-2 rounded-md bg-deal text-white dark:text-black px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
          -{discountPercent}%
        </span>
      )}
    </>
  );

  const price = (
    <div className="flex items-baseline flex-wrap gap-x-2">
      <span className="text-base sm:text-lg font-bold text-foreground tabular-nums tracking-tight">
        {formatBdt(product.cashPriceBdt)}
      </span>
      {discountPercent > 0 && (
        <span className="text-xs text-muted-foreground line-through tabular-nums">
          {formatBdt(product.regularPriceBdt)}
        </span>
      )}
    </div>
  );

  const stock = (
    <span className={`inline-flex items-center gap-1.5 text-[11px] ${orderable ? "text-success" : "text-muted-foreground"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${orderable ? "bg-success" : "bg-muted-foreground"}`} />
      {STOCK_LABELS[product.stockStatus]}
    </span>
  );

  const compareButton = (
    <button
      type="button"
      onClick={handleCompare}
      aria-pressed={compared}
      aria-label={compared ? `Remove ${product.name} from compare` : `Compare ${product.name}`}
      title="Compare"
      className={`p-2 rounded-lg border transition-colors shrink-0 ${
        compared ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      <GitCompare className="w-4 h-4" />
    </button>
  );

  const cartButton = (
    <button
      type="button"
      disabled={!orderable}
      onClick={() => {
        addToCart();
        router.push("/cart");
      }}
      className="btn-primary flex-1 min-w-0 py-2 px-3 text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <ShoppingCart className="w-4 h-4 shrink-0" />
      <span className="truncate">{orderable ? "Buy now" : STOCK_LABELS[product.stockStatus]}</span>
    </button>
  );

  if (viewMode === "list") {
    return (
      <article className="group surface p-3 sm:p-4 flex flex-col md:flex-row items-stretch gap-4 transition-colors hover:border-foreground/25">
        <Link
          href={`/products/${product.slug}`}
          className="relative w-full md:w-44 h-40 shrink-0 bg-white rounded-lg overflow-hidden flex items-center justify-center p-3"
        >
          {image}
        </Link>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="eyebrow truncate">{product.brand}</div>
          <h3 className="font-semibold text-sm sm:text-base text-foreground leading-snug line-clamp-2">
            <Link href={`/products/${product.slug}`} className="hover:text-primary transition-colors">
              {product.name}
            </Link>
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1 pt-1">
            {product.keyFeatures.slice(0, 3).map((feature) => (
              <li key={feature} className="line-clamp-1">
                {feature}
              </li>
            ))}
          </ul>
          {product.warrantyNotice && <p className="text-xs text-muted-foreground">{product.warrantyNotice}</p>}
        </div>

        <div className="md:w-52 shrink-0 flex flex-col justify-between gap-3 border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-4">
          <div className="space-y-1">
            {price}
            {stock}
          </div>
          <div className="flex items-center gap-2">
            {cartButton}
            {compareButton}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group surface p-2.5 sm:p-3 flex flex-col transition-all duration-200 hover:border-foreground/25 hover:-translate-y-0.5 hover:[box-shadow:var(--shadow-raised)]">
      <Link
        href={`/products/${product.slug}`}
        className="relative block w-full aspect-square bg-white rounded-lg overflow-hidden p-3"
        tabIndex={-1}
        aria-hidden="true"
      >
        {image}
      </Link>

      <div className="flex-1 flex flex-col pt-3 gap-1.5">
        <div className="eyebrow truncate">{product.brand || product.categoryName}</div>
        <h3 className="text-[13px] sm:text-sm font-semibold text-foreground leading-snug line-clamp-2 min-h-[2.5em]">
          <Link href={`/products/${product.slug}`} className="hover:text-primary transition-colors">
            {product.name}
          </Link>
        </h3>

        <div className="mt-auto pt-1.5 space-y-0.5">
          {price}
          {stock}
        </div>

        <div className="flex items-center gap-2 pt-2">
          {cartButton}
          <span className="hidden sm:inline-flex">{compareButton}</span>
        </div>
      </div>
    </article>
  );
}
