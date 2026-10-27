"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Building2,
  CheckCircle2,
  ShoppingCart,
  GitCompare,
  ChevronRight,
  HelpCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { CATALOG_PRODUCTS, getProductBySlug, Product } from "@/lib/catalog";
import { formatBdt } from "@solusation/shared-types";
import { useCartStore } from "@/stores/cart-store";
import { useCompareStore } from "@/stores/compare-store";
import { ProductCard } from "@/components/product-card";
import { storefrontApi } from "@/lib/api";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = use(params);
  const router = useRouter();

  // Load product from catalog or API
  const [product, setProduct] = useState<Product | null>(() => getProductBySlug(slug) || null);
  const [loading, setLoading] = useState<boolean>(!product);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedPricingTier, setSelectedPricingTier] = useState<"CASH" | "REGULAR">("CASH");
  const [activeTab, setActiveTab] = useState<"specs" | "branches" | "warranty" | "video">("specs");
  const [addedToast, setAddedToast] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const { addComponent, isSelected } = useCompareStore();

  useEffect(() => {
    let isMounted = true;

    const fetchProductData = async () => {
      // 1. Check static catalog
      const catalogMatch = getProductBySlug(slug);
      if (catalogMatch) {
        if (isMounted) {
          setProduct(catalogMatch);
          setSelectedImage(catalogMatch.images[0] || catalogMatch.thumbnailUrl);
          setLoading(false);
        }
        return;
      }

      // 2. Fetch from backend database API
      setLoading(true);
      try {
        const apiData = await storefrontApi.getProductBySlug(slug);
        if (isMounted && apiData) {
          const normalized: Product = {
            id: apiData.id,
            name: apiData.name,
            slug: apiData.slug,
            sku: apiData.sku,
            brand: apiData.brand?.name || "Official Brand",
            categorySlug: apiData.category?.slug || "components",
            categoryName: apiData.category?.name || "Components",
            cashPriceBdt: apiData.cashPriceBdt,
            regularPriceBdt: apiData.regularPriceBdt,
            costPriceBdt: apiData.costPriceBdt,
            isEmiAvailable: apiData.isEmiAvailable ?? true,
            totalStock: apiData.totalStock ?? 10,
            stockStatus: apiData.stockStatus || "IN_STOCK",
            thumbnailUrl:
              apiData.images?.[0] ||
              "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800",
            images:
              apiData.images && apiData.images.length > 0
                ? apiData.images
                : ["https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800"],
            keyFeatures: apiData.keyFeatures || [],
            warrantyDurationMonths: apiData.warrantyDurationMonths || 36,
            warrantyNotice:
              apiData.warrantyTerms ||
              `${apiData.warrantyDurationMonths || 36} Months Official Warranty`,
            videoUrl: apiData.videoUrl || apiData.video_url || null,
            branchStocks: {
              IDB: apiData.branchInventory?.find((b: any) => b.branchCode === "IDB")?.stock ?? 5,
              MULTIPLAN:
                apiData.branchInventory?.find((b: any) => b.branchCode === "MULTIPLAN")?.stock ?? 5,
              UTTARA:
                apiData.branchInventory?.find((b: any) => b.branchCode === "UTTARA")?.stock ?? 4,
              AGRABAD:
                apiData.branchInventory?.find((b: any) => b.branchCode === "AGRABAD")?.stock ?? 2,
              ONLINE_WAREHOUSE:
                apiData.branchInventory?.find((b: any) => b.branchCode === "ONLINE_WAREHOUSE")
                  ?.stock ?? 10,
            },
            specifications: apiData.specifications || [],
            compatibility: apiData.compatibility || {},
          };

          setProduct(normalized);
          setSelectedImage(normalized.images[0] || normalized.thumbnailUrl);
        }
      } catch (err) {
        console.error("Failed to load product by slug:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProductData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground font-medium">
          Loading product specifications...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 bg-muted/60 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
          <HelpCircle className="w-8 h-8 stroke-1 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-foreground">Product Not Found</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          The product you are looking for is currently unavailable or the link may have been updated.
          Browse our complete hardware catalog to find what you need.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/products"
            className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-primary/20 transition-all"
          >
            Browse All Products
          </Link>
          <Link
            href="/"
            className="bg-muted text-foreground border border-border font-bold px-6 py-2.5 rounded-xl text-xs hover:bg-muted/80 transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const compared = isSelected(product.id);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      cashPriceBdt: product.cashPriceBdt,
      regularPriceBdt: product.regularPriceBdt,
      thumbnailUrl: product.thumbnailUrl,
      quantity,
      pricingType: "CASH",
    });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
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
              src={selectedImage || product.thumbnailUrl}
              alt={product.name}
              className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute top-4 left-4">
              <span className="px-2.5 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {product.stockStatus.replace("_", " ")}
              </span>
            </div>
            {product.videoUrl && (
              <button
                onClick={() => {
                  setActiveTab("video");
                  const tabEl = document.getElementById("product-tabs");
                  if (tabEl) tabEl.scrollIntoView({ behavior: "smooth" });
                }}
                className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span>Watch Video</span>
              </button>
            )}
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
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-border/80"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}

          {/* Value Badges */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/60">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
              <div>
                <div className="font-bold">Official Warranty</div>
                <div className="text-[10px] text-muted-foreground">{product.warrantyNotice}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/60">
              <Truck className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <div className="font-bold">Fast Delivery</div>
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

          {/* Pricing Box (Star Tech Style - Zero EMI) */}
          <div className="bg-slate-50 dark:bg-[#0d1620] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Special Cash Price
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                    {formatBdt(product.cashPriceBdt)}
                  </span>
                  {product.regularPriceBdt > product.cashPriceBdt && (
                    <span className="text-base text-slate-400 dark:text-slate-500 line-through font-normal">
                      Regular: {formatBdt(product.regularPriceBdt)}
                    </span>
                  )}
                </div>
              </div>

              {product.regularPriceBdt > product.cashPriceBdt && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#673ab7]/10 text-[#673ab7] dark:text-purple-400 font-bold text-xs border border-[#673ab7]/20 self-start sm:self-auto">
                  <span>Save: {formatBdt(product.regularPriceBdt - product.cashPriceBdt)}</span>
                  <span>({Math.round(((product.regularPriceBdt - product.cashPriceBdt) / product.regularPriceBdt) * 100)}% OFF)</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Cash on Delivery & bKash Available</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span>100% Genuine Box Pack with Warranty</span>
            </div>
          </div>

          {/* Key Features Bullet List */}
          {product.keyFeatures && product.keyFeatures.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Key Highlights
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {product.keyFeatures.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-card rounded-lg border border-border/60"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-foreground">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              className="flex-1 w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-black py-3 px-6 rounded-xl text-sm flex items-center justify-center shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
            >
              <span>Buy Now</span>
            </button>

            <button
              onClick={handleAddToCart}
              className="flex-1 w-full sm:w-auto bg-card hover:bg-muted text-foreground border-2 border-border hover:border-primary/50 font-bold py-3 px-6 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
            >
              {addedToast ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-500 font-bold">Added to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  <span>Add to Cart</span>
                </>
              )}
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

      {/* Detail Tabs (Specifications, Physical Branch Inventory, Warranty, YouTube Video) */}
      <div id="product-tabs" className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mt-10">
        <div className="flex items-center border-b border-border bg-muted/20 px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("specs")}
            className={`py-3.5 px-5 font-bold text-sm border-b-2 transition-colors shrink-0 ${
              activeTab === "specs"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Specification
          </button>
          <button
            onClick={() => setActiveTab("branches")}
            className={`py-3.5 px-5 font-bold text-sm border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
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
            className={`py-3.5 px-5 font-bold text-sm border-b-2 transition-colors shrink-0 ${
              activeTab === "warranty"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Warranty Policy
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={`py-3.5 px-5 font-bold text-sm border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === "video"
                ? "border-red-600 text-red-600 dark:text-red-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <span>Video Review</span>
            {product.videoUrl && (
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse ml-0.5" />
            )}
          </button>
        </div>

        <div className="p-6">
          {activeTab === "specs" && (
            <div className="space-y-4 max-w-4xl">
              <table className="w-full text-xs text-left border-collapse">
                <tbody>
                  {product.specifications && product.specifications.length > 0 ? (
                    product.specifications.map((spec, index) => (
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-muted-foreground">
                        Standard manufacturer specifications apply for this product.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "branches" && (
            <div className="space-y-4 max-w-3xl">
              <p className="text-xs text-muted-foreground">
                Current physical stock in our retail outlets across Dhaka and Chattogram. You can pick
                up directly or order online.
              </p>
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {product.branchStocks &&
                  Object.entries(product.branchStocks).map(([code, stock]) => (
                    <div
                      key={code}
                      className="p-3.5 flex items-center justify-between bg-card text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span className="font-bold text-foreground">
                          {BRANCH_NAMES[code] || code}
                        </span>
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
                This product includes <strong>{product.warrantyNotice}</strong> directly honored by
                the official Bangladesh importer and The Solusation BD service center.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Every box carries a unique serial number sticker. Please retain the outer box
                  packaging for warranty claims.
                </li>
                <li>
                  Physical burns, liquid damage, cracked pins, or unauthorized tampering void the
                  official warranty.
                </li>
                <li>
                  To check or claim warranty, enter your box serial number on our Warranty Tracking
                  portal.
                </li>
              </ul>
            </div>
          )}

          {activeTab === "video" && (
            <div className="space-y-4 max-w-4xl">
              {product.videoUrl && getYouTubeEmbedUrl(product.videoUrl) ? (
                <>
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border shadow-xl bg-black">
                    <iframe
                      src={`${getYouTubeEmbedUrl(product.videoUrl)}?autoplay=0&rel=0`}
                      title={product.name}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground bg-muted/30 p-3.5 rounded-xl border border-border">
                    <div className="flex items-center gap-2.5">
                      <svg className="w-5 h-5 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      <span className="font-bold text-foreground">Official Product Video, Unboxing & Benchmark</span>
                    </div>
                    <a
                      href={product.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold hover:underline"
                    >
                      <span>Watch on YouTube</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center bg-card rounded-xl border border-dashed border-border space-y-3">
                  <svg className="w-12 h-12 text-muted-foreground mx-auto opacity-40" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  <h3 className="text-sm font-bold text-foreground">No YouTube Video Linked Yet</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    An official unboxing or benchmark review video has not been added for this product yet.
                  </p>
                </div>
              )}
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
