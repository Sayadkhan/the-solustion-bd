"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Filter,
  SlidersHorizontal,
  Grid3X3,
  List,
  ChevronRight,
  RotateCcw,
  Check,
  Search,
  X,
} from "lucide-react";
import { CATALOG_PRODUCTS, CATEGORIES, Product } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { ProductCardSkeleton } from "@/components/product-card-skeleton";
import { formatBdt } from "@solusation/shared-types";
import { storefrontApi, normalizeImageUrl } from "@/lib/api";

function formatRawProduct(p: any): Product {
  const rawThumb = p.thumbnailUrl || (Array.isArray(p.images) && p.images[0]) || null;
  const normalizedThumb = normalizeImageUrl(rawThumb);
  const normalizedImages = Array.isArray(p.images) && p.images.length > 0
    ? p.images.map((img: string) => normalizeImageUrl(img))
    : [normalizedThumb];

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku || `SKU-${p.id.slice(0, 6)}`,
    brand: p.brand?.name || p.brand || "Authentic",
    categorySlug: p.category?.slug || p.categorySlug || "processor",
    categoryName: p.category?.name || p.categoryName || "Hardware",
    cashPriceBdt: Number(p.cashPriceBdt) || 0,
    regularPriceBdt: Number(p.regularPriceBdt) || Number(p.cashPriceBdt) || 0,
    costPriceBdt: Number(p.costPriceBdt) || 0,
    isEmiAvailable: Boolean(p.isEmiAvailable),
    totalStock: Number(p.totalStock) || 10,
    stockStatus: p.stockStatus || "IN_STOCK",
    thumbnailUrl: normalizedThumb,
    images: normalizedImages,
    keyFeatures: p.keyFeatures || [
      "Official Distributor Warranty",
      "Box Serial Number Tracking",
      "100% Genuine Box Pack",
    ],
    warrantyDurationMonths: p.warrantyDurationMonths || 36,
    warrantyNotice: p.warrantyNotice || "3 Years Official Warranty",
    videoUrl: p.videoUrl || p.video_url || null,
    branchStocks: p.branchStocks || {},
    specifications: p.specifications || [],
    compatibility: p.compatibility || { componentType: "OTHER" },
  };
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedCategory = searchParams.get("category") || "all";
  const selectedBrand = searchParams.get("brand") || "all";
  const searchQuery = searchParams.get("q") || "";

  // Progressive products state: instant catalog fallback + live backend hydration
  const [productsList, setProductsList] = useState<Product[]>(() => {
    if (selectedCategory !== "all") {
      const matched = CATALOG_PRODUCTS.filter(
        (p) =>
          p.categorySlug === selectedCategory ||
          p.categorySlug.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          selectedCategory.toLowerCase().includes(p.categorySlug.toLowerCase())
      );
      return matched.length > 0 ? matched : CATALOG_PRODUCTS;
    }
    return CATALOG_PRODUCTS;
  });
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isStreamingMore, setIsStreamingMore] = useState(false);

  // Progressive live products fetch from backend
  useEffect(() => {
    let isCancelled = false;

    async function loadProgressiveProducts() {
      try {
        // Step 1: Fast initial batch from backend
        const initialBatch = await storefrontApi.getProducts({
          category: selectedCategory !== "all" ? selectedCategory : undefined,
          search: searchQuery || undefined,
          limit: 12,
          page: 1,
        });

        if (isCancelled) return;

        if (initialBatch && initialBatch.length > 0) {
          setProductsList(initialBatch.map(formatRawProduct));
          setIsStreamingMore(true);
        }

        // Step 2: Background Full Batch (Stream up to 100 products to smoothly hydrate remaining catalog)
        const fullBatch = await storefrontApi.getProducts({
          category: selectedCategory !== "all" ? selectedCategory : undefined,
          search: searchQuery || undefined,
          limit: 100,
          page: 1,
        });

        if (isCancelled) return;

        if (fullBatch && fullBatch.length > 0) {
          setProductsList(fullBatch.map(formatRawProduct));
        }
      } catch (err) {
        console.warn("Progressive products catalog fetch fallback:", err);
      } finally {
        if (!isCancelled) {
          setIsInitialLoading(false);
          setIsStreamingMore(false);
        }
      }
    }

    loadProgressiveProducts();

    return () => {
      isCancelled = true;
    };
  }, [selectedCategory, searchQuery]);

  // Local filter states
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(200000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    selectedBrand !== "all" ? [selectedBrand] : []
  );
  const [selectedSocket, setSelectedSocket] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("price-asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Available unique brands from catalog
  const allBrands = useMemo(() => {
    return Array.from(new Set(productsList.map((p) => p.brand))).sort();
  }, [productsList]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return productsList.filter((prod) => {
      // Category filter
      if (
        selectedCategory !== "all" &&
        prod.categorySlug &&
        prod.categorySlug !== selectedCategory &&
        !selectedCategory.toLowerCase().includes(prod.categorySlug.toLowerCase()) &&
        !prod.categorySlug.toLowerCase().includes(selectedCategory.toLowerCase())
      ) {
        return false;
      }

      // Search filter
      if (
        searchQuery &&
        !prod.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !prod.brand.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Price filter (200,000+ means unlimited max)
      if (prod.cashPriceBdt < minPrice || (maxPrice < 200000 && prod.cashPriceBdt > maxPrice)) {
        return false;
      }

      // Stock filter
      if (inStockOnly && prod.stockStatus !== "IN_STOCK") {
        return false;
      }

      // Brand filter
      if (selectedBrands.length > 0 && !selectedBrands.includes(prod.brand)) {
        return false;
      }

      // Socket filter
      if (selectedSocket !== "all" && prod.compatibility.socket !== selectedSocket) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price-asc") return a.cashPriceBdt - b.cashPriceBdt;
      if (sortBy === "price-desc") return b.cashPriceBdt - a.cashPriceBdt;
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [
    selectedCategory,
    searchQuery,
    minPrice,
    maxPrice,
    inStockOnly,
    selectedBrands,
    selectedSocket,
    sortBy,
  ]);

  const toggleBrand = (b: string) => {
    setSelectedBrands((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  };

  const resetFilters = () => {
    setMinPrice(0);
    setMaxPrice(200000);
    setInStockOnly(false);
    setSelectedBrands([]);
    setSelectedSocket("all");
    setSortBy("price-asc");
    router.push("/products");
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-primary transition-colors">
          Components & Hardware
        </Link>
        {selectedCategory !== "all" && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-foreground capitalize">
              {CATEGORIES.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
            </span>
          </>
        )}
      </nav>

      {/* Page Title & Mobile Filter Trigger */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {selectedCategory === "all"
              ? "All PC Hardware & Components"
              : CATEGORIES.find((c) => c.slug === selectedCategory)?.name || "Components"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Browse genuine Bangladeshi hardware with official warranty and instant cash discount.
          </p>
        </div>

        <button
          onClick={() => setMobileFilterOpen(true)}
          className="lg:hidden flex items-center space-x-2 bg-primary/10 text-primary border border-primary/20 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-transform"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters ({filteredProducts.length})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Filter Sidebar (Desktop) */}
        <aside className="hidden lg:block space-y-6 bg-card p-5 rounded-xl border border-border/70 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="font-bold text-sm text-foreground flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <span>Filters</span>
            </span>
            <button
              onClick={resetFilters}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Categories
            </h4>
            <div className="space-y-1">
              <Link
                href="/products"
                className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                  selectedCategory === "all"
                    ? "bg-primary text-white font-bold"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <span>All Categories</span>
                <span>{CATALOG_PRODUCTS.length}</span>
              </Link>
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                    selectedCategory === cat.slug
                      ? "bg-primary text-white font-bold"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="opacity-70 text-[10px]">
                    {CATALOG_PRODUCTS.filter((p) => p.categorySlug === cat.slug).length}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-3 pt-3 border-t border-border/70">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Price Range (BDT)
              </h4>
              <span className="text-xs font-bold text-primary">
                {formatBdt(maxPrice)}
              </span>
            </div>
            <input
              type="range"
              min={10000}
              max={200000}
              step={5000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>৳10,000</span>
              <span>৳2,00,000+</span>
            </div>
          </div>

          {/* In Stock Toggle */}
          <div className="pt-3 border-t border-border/70">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
              />
              <span className="text-xs font-semibold text-foreground">
                In Stock Only (Physical Branches)
              </span>
            </label>
          </div>

          {/* Brand Filter */}
          <div className="space-y-2 pt-3 border-t border-border/70">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Brands
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {allBrands.map((brand) => {
                const checked = selectedBrands.includes(brand);
                return (
                  <label
                    key={brand}
                    className="flex items-center space-x-2 text-xs text-foreground cursor-pointer hover:text-primary transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBrand(brand)}
                      className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary accent-primary"
                    />
                    <span>{brand}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Processor Sockets */}
          <div className="space-y-2 pt-3 border-t border-border/70">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Socket / Platform
            </h4>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {["all", "AM5", "LGA1700"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSocket(s)}
                  className={`py-1 px-2 rounded border text-center font-medium transition-colors ${
                    selectedSocket === s
                      ? "bg-primary text-white border-primary"
                      : "border-border hover:bg-muted text-foreground"
                  }`}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Mobile Filter Slide-over Drawer / Bottom Sheet */}
        {mobileFilterOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className="fixed inset-0"
              onClick={() => setMobileFilterOpen(false)}
            />
            <div className="relative z-10 bg-card rounded-t-3xl max-h-[85vh] flex flex-col border-t border-border shadow-2xl animate-in slide-in-from-bottom duration-300">
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 px-5 border-b border-border">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  <span>Filters ({filteredProducts.length} items)</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={resetFilters}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 font-medium transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="p-5 overflow-y-auto space-y-6 flex-1">
                {/* Categories */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Categories
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Link
                      href="/products"
                      onClick={() => setMobileFilterOpen(false)}
                      className={`flex items-center justify-between text-xs px-2.5 py-2 rounded-lg transition-colors ${
                        selectedCategory === "all"
                          ? "bg-primary text-white font-bold"
                          : "bg-muted/30 text-foreground"
                      }`}
                    >
                      <span>All Categories</span>
                    </Link>
                    {CATEGORIES.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/products?category=${cat.slug}`}
                        onClick={() => setMobileFilterOpen(false)}
                        className={`flex items-center justify-between text-xs px-2.5 py-2 rounded-lg transition-colors ${
                          selectedCategory === cat.slug
                            ? "bg-primary text-white font-bold"
                            : "bg-muted/30 text-foreground"
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Price Range Slider */}
                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Max Price
                    </h4>
                    <span className="text-xs font-bold text-primary">
                      {formatBdt(maxPrice)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10000}
                    max={200000}
                    step={5000}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                  />
                </div>

                {/* In Stock Toggle */}
                <div className="pt-3 border-t border-border">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
                    />
                    <span className="text-xs font-semibold text-foreground">
                      In Stock Only
                    </span>
                  </label>
                </div>

                {/* Brands */}
                <div className="space-y-2 pt-3 border-t border-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Brands
                  </h4>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {allBrands.map((brand) => {
                      const checked = selectedBrands.includes(brand);
                      return (
                        <label
                          key={brand}
                          className="flex items-center space-x-2 text-xs text-foreground cursor-pointer p-1.5 rounded-lg bg-muted/20"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleBrand(brand)}
                            className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary accent-primary"
                          />
                          <span className="truncate">{brand}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Drawer Apply Button */}
              <div className="p-4 border-t border-border bg-card">
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-primary/25 transition-all active:scale-95"
                >
                  Apply Filters ({filteredProducts.length} Results)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid Area */}
        <main className="lg:col-span-3 space-y-6">
          {/* Top Sort & View Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/70 text-xs">
            <div className="text-muted-foreground font-medium">
              Showing <strong className="text-foreground">{filteredProducts.length}</strong> items
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
              {/* Sort By Dropdown */}
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground hidden sm:inline">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-muted/50 border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                >
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                </select>
              </div>

              {/* Grid / List Switcher */}
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 transition-colors ${
                    viewMode === "grid" ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground"
                  }`}
                  title="Grid view"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 transition-colors ${
                    viewMode === "list" ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground"
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Products Render: Progressive Streaming & Skeletons */}
          {isInitialLoading ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-5"
                  : "space-y-4"
              }
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <ProductCardSkeleton key={`init-skel-${i}`} viewMode={viewMode} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center bg-card rounded-xl border border-dashed border-border space-y-3">
              <Search className="w-10 h-10 text-muted-foreground mx-auto stroke-1" />
              <h3 className="text-base font-bold text-foreground">No components found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No products match your selected filters. Try clearing or relaxing price and brand filters.
              </p>
              <button
                onClick={resetFilters}
                className="inline-block bg-primary text-white font-bold px-4 py-2 rounded-lg text-xs hover:bg-primary/90"
              >
                Clear All Filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-5">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} viewMode="grid" />
              ))}

              {/* Progressive Streaming Skeletons */}
              {isStreamingMore && (
                <>
                  <div className="col-span-full py-2.5 px-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                      <span>Loaded first {productsList.length} products. Streaming remaining catalog...</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono tracking-wider opacity-75 font-bold">
                      Progressive Loading
                    </span>
                  </div>
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <ProductCardSkeleton key={`stream-skel-${idx}`} viewMode="grid" />
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} viewMode="list" />
              ))}

              {/* Progressive Streaming Skeletons in List View */}
              {isStreamingMore && (
                <>
                  <div className="py-2.5 px-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                      <span>Loaded first {productsList.length} products. Streaming remaining catalog...</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono tracking-wider opacity-75 font-bold">
                      Progressive Loading
                    </span>
                  </div>
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <ProductCardSkeleton key={`stream-skel-list-${idx}`} viewMode="list" />
                  ))}
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-12 text-center text-sm">Loading components...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
