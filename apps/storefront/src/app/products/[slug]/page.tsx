"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Building2,
  CheckCircle2,
  ShoppingCart,
  Zap,
  GitCompare,
  ArrowRight,
  ChevronRight,
  Layers,
  HelpCircle,
  Share2,
  Calendar,
} from "lucide-react";
import { CATALOG_PRODUCTS, getProductBySlug } from "@/lib/catalog";
import { formatBdt } from "@solusation/shared-types";
import { useCartStore } from "@/stores/cart-store";
import { useCompareStore } from "@/stores/compare-store";
import { ProductCard } from "@/components/product-card";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = use(params);
  const router = useRouter();

  const product = getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const [selectedImage, setSelectedImage] = useState<string>(
    product.images[0] || product.thumbnailUrl
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedPricingTier, setSelectedPricingTier] = useState<"CASH" | "REGULAR">("CASH");
  const [activeTab, setActiveTab] = useState<"specs" | "branches" | "warranty">("specs");

  const addItem = useCartStore((s) => s.addItem);
  const { addComponent, isSelected } = useCompareStore();
  const compared = isSelected(product.id);

  // EMI monthly amounts
  const emi3 = Math.round(product.regularPriceBdt / 3);
  const emi6 = Math.round(product.regularPriceBdt / 6);
  const emi12 = Math.round(product.regularPriceBdt / 12);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      cashPriceBdt: product.cashPriceBdt,
      regularPriceBdt: product.regularPriceBdt,
      thumbnailUrl: product.thumbnailUrl,
      quantity,
      pricingType: selectedPricingTier,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/cart");
  };

  const handleCompare = () => {
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

  // Related products from same category
  const relatedProducts = CATALOG_PRODUCTS.filter(
    (p) => p.categorySlug === product.categorySlug && p.id !== product.id
  ).slice(0, 3);

  const BRANCH_NAMES: Record<string, string> = {
    IDB: "IDB Bhaban Branch (Dhaka)",
    MULTIPLAN: "Multiplan Center Branch (Elephant Road, Dhaka)",
    UTTARA: "Uttara Branch (Sector 3, Dhaka)",
    AGRABAD: "Agrabad Branch (Chattogram)",
    ONLINE_WAREHOUSE: "Central Online Warehouse (Dhaka)",
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-primary transition-colors">
          Components
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link
          href={`/products?category=${product.categorySlug}`}
          className="hover:text-primary transition-colors capitalize"
        >
          {product.categoryName}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-foreground truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6 flex items-center justify-center h-80 sm:h-96 relative overflow-hidden shadow-sm">
            <img
              src={selectedImage}
              alt={product.name}
              className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute top-4 left-4">
              <span className="px-2.5 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {product.stockStatus.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 rounded-xl border p-1 bg-card transition-all ${
                    selectedImage === img
                      ? "border-primary shadow-md ring-2 ring-primary/20"
                      : "border-border hover:border-muted-foreground/50 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-muted/40 rounded-xl border border-border/60 flex items-center gap-2.5 text-xs text-foreground">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
              <div>
                <div className="font-bold">100% Genuine Box</div>
                <div className="text-[10px] text-muted-foreground">Scan serial for warranty</div>
              </div>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl border border-border/60 flex items-center gap-2.5 text-xs text-foreground">
              <Truck className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <div className="font-bold">Fast BD Delivery</div>
                <div className="text-[10px] text-muted-foreground">Pathao & Steadfast Courier</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Info & Pricing Block (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
              <span className="text-primary uppercase tracking-wider">{product.brand}</span>
              <span>•</span>
              <span>SKU: {product.sku}</span>
              <span>•</span>
              <span className="text-emerald-500">{product.warrantyNotice}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Bangladeshi Dual Pricing Hero Box */}
          <div className="bg-gradient-to-br from-card to-muted/30 p-5 rounded-2xl border-2 border-primary/20 shadow-lg space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cash Discount Option */}
              <div
                onClick={() => setSelectedPricingTier("CASH")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPricingTier === "CASH"
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-border/80 bg-background"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase text-primary tracking-wider">
                    Special Cash Price
                  </span>
                  <span className="text-[10px] bg-primary text-white font-bold px-1.5 py-0.5 rounded">
                    Save {formatBdt(product.regularPriceBdt - product.cashPriceBdt)}
                  </span>
                </div>
                <div className="text-2xl font-black text-primary">
                  {formatBdt(product.cashPriceBdt)}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Applicable for Cash, bKash, Nagad, or Bank Transfer
                </div>
              </div>

              {/* Regular / EMI Option */}
              <div
                onClick={() => setSelectedPricingTier("REGULAR")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPricingTier === "REGULAR"
                    ? "border-amber-500 bg-amber-500/5 shadow-md"
                    : "border-border hover:border-border/80 bg-background"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                    Regular / EMI Price
                  </span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 font-bold px-1.5 py-0.5 rounded border border-amber-500/20">
                    Up to 12 Mos
                  </span>
                </div>
                <div className="text-2xl font-black text-foreground">
                  {formatBdt(product.regularPriceBdt)}
                </div>
                <div className="text-[11px] text-amber-500 font-semibold mt-1">
                  Starts at {formatBdt(emi12)}/mo on selected credit cards
                </div>
              </div>
            </div>

            {/* EMI Breakdown details */}
            {product.isEmiAvailable && (
              <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/50">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span>Available EMI Plans:</span>
                </span>
                <span className="space-x-2 text-[11px] font-bold text-foreground">
                  <span>3m: {formatBdt(emi3)}</span>
                  <span>•</span>
                  <span>6m: {formatBdt(emi6)}</span>
                  <span>•</span>
                  <span>12m: {formatBdt(emi12)}</span>
                </span>
              </div>
            )}
          </div>

          {/* Key Features Bullet List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Key Highlights
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {product.keyFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-card rounded-lg border border-border/60">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-foreground">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            {/* Quantity */}
            <div className="flex items-center border border-border rounded-xl bg-card p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg hover:bg-muted font-bold text-sm"
              >
                -
              </button>
              <span className="w-10 text-center font-bold text-sm text-foreground">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg hover:bg-muted font-bold text-sm"
              >
                +
              </button>
            </div>

            <button
              onClick={handleBuyNow}
              className="flex-1 w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-black py-3 px-6 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
            >
              <Zap className="w-4 h-4" />
              <span>Buy Now</span>
            </button>

            <button
              onClick={handleAddToCart}
              className="flex-1 w-full sm:w-auto bg-card hover:bg-muted text-foreground border-2 border-border hover:border-primary/50 font-bold py-3 px-6 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
            >
              <ShoppingCart className="w-4 h-4 text-primary" />
              <span>Add to Cart</span>
            </button>

            <button
              onClick={handleCompare}
              className={`p-3 rounded-xl border text-sm transition-colors ${
                compared
                  ? "bg-primary text-white border-primary"
                  : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
              title="Add to Compare"
            >
              <GitCompare className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Tabs (Specifications, Physical Branch Inventory, Warranty) */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mt-10">
        <div className="flex items-center border-b border-border bg-muted/20 px-4">
          <button
            onClick={() => setActiveTab("specs")}
            className={`py-3.5 px-5 font-bold text-sm border-b-2 transition-colors ${
              activeTab === "specs"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Specification
          </button>
          <button
            onClick={() => setActiveTab("branches")}
            className={`py-3.5 px-5 font-bold text-sm border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "branches"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Branch Availability</span>
          </button>
          <button
            onClick={() => setActiveTab("warranty")}
            className={`py-3.5 px-5 font-bold text-sm border-b-2 transition-colors ${
              activeTab === "warranty"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Warranty Policy
          </button>
        </div>

        <div className="p-6">
          {activeTab === "specs" && (
            <div className="space-y-4 max-w-4xl">
              <table className="w-full text-xs text-left border-collapse">
                <tbody>
                  {product.specifications.map((spec, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-muted/30" : "bg-transparent"}
                    >
                      <td className="py-2.5 px-4 font-semibold text-muted-foreground w-1/3 border-b border-border/50">
                        {spec.label}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-foreground border-b border-border/50">
                        {spec.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "branches" && (
            <div className="space-y-4 max-w-3xl">
              <p className="text-xs text-muted-foreground">
                Current physical stock in our retail outlets across Dhaka and Chattogram. You can pick up directly or order online.
              </p>
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {Object.entries(product.branchStocks).map(([code, stock]) => (
                  <div key={code} className="p-3.5 flex items-center justify-between bg-card text-xs">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      <span className="font-bold text-foreground">{BRANCH_NAMES[code] || code}</span>
                    </div>
                    <div>
                      {stock > 0 ? (
                        <span className="px-2 py-0.5 rounded font-extrabold text-[11px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          In Stock ({stock} Units)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded font-extrabold text-[11px] bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "warranty" && (
            <div className="space-y-3 max-w-2xl text-xs text-muted-foreground leading-relaxed">
              <h4 className="font-bold text-sm text-foreground">
                Official Bangladesh Warranty Terms (Rule 4.4)
              </h4>
              <p>
                This product includes <strong>{product.warrantyNotice}</strong> directly honored by the official Bangladesh importer and The Solusation BD service center.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Every box carries a unique serial number sticker. Please retain the outer box packaging for warranty claims.</li>
                <li>Physical burns, liquid damage, cracked pins, or unauthorized tampering void the official warranty.</li>
                <li>To check or claim warranty, enter your box serial number on our Warranty Tracking portal.</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">
              Related Hardware
            </h2>
            <Link
              href={`/products?category=${product.categorySlug}`}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
