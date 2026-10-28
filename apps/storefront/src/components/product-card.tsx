"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, GitCompare, ShieldCheck, CheckCircle2 } from "lucide-react";
import { formatBdt } from "@solusation/shared-types";
import { useCartStore } from "@/stores/cart-store";
import { useCompareStore } from "@/stores/compare-store";
import { Product } from "@/lib/catalog";

interface ProductCardProps {
  product: Product;
  viewMode?: "grid" | "list";
}

export function ProductCard({ product, viewMode = "grid" }: ProductCardProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const { addComponent, isSelected } = useCompareStore();
  const compared = isSelected(product.id);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  // Calculate discount amount and percentage
  const discountAmount = Math.max(0, product.regularPriceBdt - product.cashPriceBdt);
  const discountPercent =
    product.regularPriceBdt > 0
      ? Math.round((discountAmount / product.regularPriceBdt) * 100)
      : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      cashPriceBdt: product.cashPriceBdt,
      regularPriceBdt: product.regularPriceBdt,
      thumbnailUrl: product.thumbnailUrl,
      quantity: 1,
      pricingType: "CASH",
    });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      cashPriceBdt: product.cashPriceBdt,
      regularPriceBdt: product.regularPriceBdt,
      thumbnailUrl: product.thumbnailUrl,
      quantity: 1,
      pricingType: "CASH",
    });
    router.push("/cart");
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
  };

  if (viewMode === "list") {
    return (
      <div className="group bg-white dark:bg-[#0d1620] rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 transition-all duration-300 shadow-sm hover:shadow-xl p-4 flex flex-col md:flex-row items-center gap-5">
        {/* Image */}
        <Link
          href={`/products/${product.slug}`}
          className="relative w-full md:w-48 h-40 shrink-0 bg-slate-50 dark:bg-slate-900/50 rounded-lg overflow-hidden flex items-center justify-center p-3"
        >
          {!imageLoaded && (
            <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800/60 animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700/50" />
            </div>
          )}
          <img
            src={product.thumbnailUrl}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-contain group-hover:scale-105 transition-all duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
          {discountAmount > 0 && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-[#673ab7] text-white z-10">
              Save: {formatBdt(discountAmount)} (-{discountPercent}%)
            </span>
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 space-y-2 text-left w-full">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-normal">
            <span className="text-blue-600 font-bold uppercase">{product.brand}</span>
            <span>•</span>
            <span className="font-normal">SKU: {product.sku}</span>
          </div>

          <Link href={`/products/${product.slug}`}>
            <h3 className="font-bold text-sm text-foreground group-hover:text-blue-600 transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>

          <ul className="text-xs text-muted-foreground font-normal space-y-1 my-2">
            {product.keyFeatures.slice(0, 3).map((f, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="line-clamp-1 font-normal">{f}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-normal">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-normal">{product.warrantyNotice}</span>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="w-full md:w-48 shrink-0 flex flex-col justify-between border-t md:border-t-0 md:border-l border-border md:pl-5 pt-3 md:pt-0">
          <div className="space-y-1">
            <div className="text-lg font-black text-blue-600">
              {formatBdt(product.cashPriceBdt)}
            </div>
            {discountAmount > 0 && (
              <div className="text-xs text-muted-foreground line-through font-normal">
                {formatBdt(product.regularPriceBdt)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleBuyNow}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-xs flex items-center justify-center gap-1.5 shadow transition-all"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Buy Now</span>
            </button>
            <button
              onClick={handleCompare}
              className={`p-2 rounded border text-xs transition-colors ${
                compared
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
              title="Compare"
            >
              <GitCompare className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Star Tech Grid View Card (matches screenshot startech_products_grid_1792953209530.png and mobile)
  return (
    <div
      onClick={() => router.push(`/products/${product.slug}`)}
      className="group bg-white dark:bg-[#0d1620] rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-xl transition-all duration-300 p-2.5 sm:p-3.5 flex flex-col justify-between relative overflow-hidden cursor-pointer"
    >
      {/* Top Left Discount Tag (Star Tech Signature Purple Badge) */}
      <div className="flex items-center justify-between mb-1">
        {discountAmount > 0 ? (
          <span className="bg-[#673ab7] text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded shadow-sm">
            Save: {formatBdt(discountAmount)} (-{discountPercent}%)
          </span>
        ) : (
          <span className="bg-emerald-600 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded">
            In Stock
          </span>
        )}

        <button
          onClick={handleCompare}
          className={`hidden sm:block p-1.5 rounded text-xs transition-colors ${
            compared
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-slate-700 dark:hover:text-white"
          }`}
          title="Compare specification"
        >
          <GitCompare className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Product Image Area with Official Warranty Tag */}
      <div className="relative w-full h-32 sm:h-44 bg-slate-50 dark:bg-slate-900/40 rounded-lg overflow-hidden flex items-center justify-center p-2 my-1">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800/60 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 dark:bg-slate-700/50" />
          </div>
        )}
        <img
          src={product.thumbnailUrl}
          alt={product.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-contain group-hover:scale-105 transition-all duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Star Tech Official Warranty Badge */}
        <div className="absolute bottom-1 right-1 flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-1 sm:px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-[8px] sm:text-[9px] font-bold text-blue-600 dark:text-blue-400 shadow-sm z-10">
          <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" />
          <span>OFFICIAL</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-left mb-1.5 sm:mb-2">
        <h3 className="font-semibold sm:font-bold text-xs sm:text-[15px] text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 h-8 sm:h-11 leading-tight sm:leading-snug">
          {product.name}
        </h3>
      </div>

      {/* Key Features Bullet List (Star Tech Style - Hidden on Mobile to match Star Tech clean deal cards) */}
      <ul className="hidden sm:block text-xs font-normal text-slate-500 dark:text-slate-400 space-y-1 mb-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        {product.keyFeatures.slice(0, 2).map((feat, idx) => (
          <li key={idx} className="flex items-start gap-1.5 text-left leading-snug">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0 mt-1.5" />
            <span className="line-clamp-1 font-normal">{feat}</span>
          </li>
        ))}
      </ul>

      {/* Pricing block (Large Red/Blue Cash Price, Strikethrough Regular Price) */}
      <div className="pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-baseline gap-1.5 sm:gap-2 text-left mb-1 sm:mb-2.5">
          <span className="text-sm sm:text-base lg:text-lg font-black text-rose-600 dark:text-rose-500">
            {formatBdt(product.cashPriceBdt)}
          </span>
          {discountAmount > 0 && (
            <span className="text-[10px] sm:text-[13px] font-normal text-slate-400 line-through">
              {formatBdt(product.regularPriceBdt)}
            </span>
          )}
        </div>

        {/* Action button (Star Tech Style Buy Now - Shown on Desktop) */}
        <button
          onClick={handleBuyNow}
          className="hidden sm:flex w-full bg-[#1340b8] hover:bg-blue-800 text-white font-bold py-2.5 px-3 rounded text-sm items-center justify-center gap-1.5 shadow transition-all active:scale-95"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Buy Now</span>
        </button>
      </div>
    </div>
  );
}
