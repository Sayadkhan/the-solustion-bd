"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Box,
  ChevronLeft,
  ChevronRight,
  CircuitBoard,
  Cpu,
  Fan,
  GitCompare,
  HardDrive,
  Layers,
  LayoutGrid,
  MapPin,
  MemoryStick,
  Monitor,
  Newspaper,
  PackageSearch,
  Phone,
  Zap,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { ProductCardSkeleton } from "@/components/product-card-skeleton";
import { ApiBanner, ApiCategory, ApiSiteSettings, storefrontApi } from "@/lib/api";
import { normalizeProduct, Product } from "@/lib/product";

const CATEGORY_ICONS: Array<[RegExp, React.ComponentType<{ className?: string }>]> = [
  [/cool/, Fan],
  [/processor|cpu/, Cpu],
  [/mother/, CircuitBoard],
  [/graphics|gpu/, Layers],
  [/ram|memory/, MemoryStick],
  [/storage|ssd|hdd/, HardDrive],
  [/power|psu/, Zap],
  [/casing|case/, Box],
  [/monitor|display/, Monitor],
];

function categoryIcon(slug: string) {
  return CATEGORY_ICONS.find(([pattern]) => pattern.test(slug))?.[1] ?? LayoutGrid;
}

const SHORTCUTS = [
  { title: "3D PC Builder", text: "Check compatibility as you build", href: "/pc-builder", icon: Cpu },
  { title: "Track order", text: "Your invoice and mobile number", href: "/track-order", icon: PackageSearch },
  { title: "Compare", text: "Side-by-side specifications", href: "/compare", icon: GitCompare },
  { title: "Tech blog", text: "Guides and reviews", href: "/blogs", icon: Newspaper },
];

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "processor", label: "Processors" },
  { id: "graphics-card", label: "Graphics cards" },
  { id: "motherboard", label: "Motherboards" },
  { id: "ram", label: "Memory" },
  { id: "storage", label: "Storage" },
  { id: "power-supply", label: "Power supplies" },
];

function discountOf(product: Product) {
  return product.regularPriceBdt > product.cashPriceBdt
    ? (product.regularPriceBdt - product.cashPriceBdt) / product.regularPriceBdt
    : 0;
}

function ProductGrid({ products, isLoading, skeletons }: { products: Product[]; isLoading: boolean; skeletons: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
      {isLoading
        ? Array.from({ length: skeletons }, (_, i) => <ProductCardSkeleton key={i} />)
        : products.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
  );
}

export default function StorefrontHomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [settings, setSettings] = useState<ApiSiteSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [heroSlides, setHeroSlides] = useState<ApiBanner[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    Promise.all([
      storefrontApi.getProducts({ limit: 40 }),
      storefrontApi.getSettings(),
      storefrontApi.getBanners(),
      storefrontApi.getCategories(),
    ]).then(([liveProducts, liveSettings, banners, liveCategories]) => {
      setProducts(liveProducts.map(normalizeProduct));
      setSettings(liveSettings);
      setHeroSlides(banners.filter((banner) => banner.type === "HERO" && banner.isActive));
      setCategories(liveCategories.main);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setCurrentSlide((slide) => (slide + 1) % heroSlides.length), 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const bestDeals = useMemo(
    () =>
      [...products]
        .filter((product) => discountOf(product) > 0)
        .sort((a, b) => discountOf(b) - discountOf(a))
        .slice(0, 5),
    [products]
  );

  const featured = useMemo(
    () => (activeTab === "all" ? products : products.filter((product) => product.categorySlug === activeTab)).slice(0, 10),
    [products, activeTab]
  );

  const offices = [
    { name: "Gulshan office", address: settings?.gulshanAddress },
    { name: "IDB office", address: settings?.idbAddress },
  ].filter((office) => office.address);

  return (
    <div className="space-y-10 sm:space-y-14 pb-14">
      {/* Hero */}
      <section className="max-w-[1600px] mx-auto px-4 pt-4 grid lg:grid-cols-12 gap-4">
        {heroSlides.length > 0 ? (
          <div className="lg:col-span-8 relative rounded-2xl overflow-hidden min-h-[280px] sm:min-h-[420px] bg-slate-950 text-white group">
            {heroSlides.map((slide, index) => (
              <div
                key={slide.id}
                aria-hidden={index !== currentSlide}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none invisible"
                }`}
              >
                {slide.image && (
                  <img src={slide.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
                <div className="relative h-full flex flex-col justify-center p-6 sm:p-12 max-w-xl space-y-3 sm:space-y-4">
                  {slide.tag && <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/70">{slide.tag}</div>}
                  <h2 className="text-3xl sm:text-5xl font-bold leading-[1.05] tracking-tight">{slide.title}</h2>
                  {slide.subtitle && <p className="text-sm sm:text-base text-white/80 line-clamp-3">{slide.subtitle}</p>}
                  <div className="pt-1">
                    <Link
                      href={slide.buttonLink || "/products"}
                      className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-white/90 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
                    >
                      {slide.buttonText || "Shop now"}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {heroSlides.length > 1 && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentSlide((slide) => (slide - 1 + heroSlides.length) % heroSlides.length)}
                  className="p-2 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentSlide((slide) => (slide + 1) % heroSlides.length)}
                  className="p-2 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* With no banners set in the admin panel, the builder leads the page. */
          <Link
            href="/pc-builder"
            className="lg:col-span-8 relative rounded-2xl overflow-hidden min-h-[320px] sm:min-h-[440px] bg-[#0b0e13] text-white group flex"
          >
            {/* A real frame from the 3D builder, fading into the panel behind the text */}
            <img
              src="/pc-builder-preview.jpg"
              alt=""
              className="absolute right-0 top-0 h-full w-full sm:w-[68%] object-cover object-center opacity-40 sm:opacity-100 transition-transform duration-700 group-hover:scale-[1.02] [mask-image:linear-gradient(90deg,transparent,black_38%)]"
            />
            <div className="relative flex flex-col justify-center p-6 sm:p-12 max-w-lg space-y-3 sm:space-y-4">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/70">3D PC Builder</div>
              <h1 className="text-4xl sm:text-6xl font-bold leading-[1] tracking-tight">Build it before you buy it.</h1>
              <p className="text-sm sm:text-base text-white/75">
                Put real parts from our stock into a 3D PC, check they fit, then power it on.
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-5 py-2.5 rounded-lg text-sm">
                  Start building
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        )}

        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3 content-stretch">
          {SHORTCUTS.map(({ title, text, href, icon: Icon }) => (
            <Link key={href} href={href} className="surface p-3 sm:p-4 flex items-center gap-3 group transition-colors hover:border-foreground/25">
              <span className="w-10 h-10 rounded-lg bg-muted text-foreground flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-sm text-foreground">{title}</span>
                <span className="hidden sm:block text-xs text-muted-foreground truncate">{text}</span>
              </span>
              <ArrowRight className="hidden sm:block w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {settings?.headerNoticeText && (
        <section className="max-w-[1600px] mx-auto px-4 -mt-5 sm:-mt-9">
          <p className="text-xs sm:text-sm text-muted-foreground border-l-2 border-primary pl-3 py-0.5">{settings.headerNoticeText}</p>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-[1600px] mx-auto px-4">
          <h2 className="section-title mb-4">Shop by category</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 sm:gap-3">
            {categories.slice(0, 18).map((category) => {
              const Icon = categoryIcon(category.slug);
              return (
                <Link
                  key={category.id}
                  href={`/products?category=${encodeURIComponent(category.slug)}`}
                  className="surface px-2 py-4 flex flex-col items-center text-center gap-2 transition-colors hover:border-primary/60 group"
                >
                  <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs font-medium text-foreground leading-tight line-clamp-2">{category.name}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Best discounts */}
      {(isLoading || bestDeals.length > 0) && (
        <section className="max-w-[1600px] mx-auto px-4">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <h2 className="section-title">Best cash discounts</h2>
              <p className="text-sm text-muted-foreground mt-0.5">The biggest savings off regular price right now.</p>
            </div>
            <Link href="/products?deals=true" className="text-sm font-medium text-primary hover:underline underline-offset-4 shrink-0">
              View all
            </Link>
          </div>
          <ProductGrid products={bestDeals} isLoading={isLoading} skeletons={5} />
        </section>
      )}

      {/* Builder band */}
      <section className="max-w-[1600px] mx-auto px-4">
        <div className="relative rounded-2xl overflow-hidden bg-[#0b0e13] text-white">
          <div className="spectrum-line h-[3px]" />
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {[
              { number: "01", title: "Choose parts", text: "Every part is a real product in our stock, with today's price." },
              { number: "02", title: "Check it fits", text: "Socket, memory, case size and power are checked as you go." },
              { number: "03", title: "Order the build", text: "Add the whole build to your cart, or share or print a quote." },
            ].map((step) => (
              <div key={step.number} className="p-5 sm:p-7">
                <div className="font-mono text-xs text-white/50">{step.number}</div>
                <h3 className="text-lg font-semibold mt-2">{step.title}</h3>
                <p className="text-sm text-white/65 mt-1">{step.text}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 p-4 sm:px-7 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-white/70">Works on your phone too.</span>
            <Link href="/pc-builder" className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-white/90 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
              Open the 3D builder
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-[1600px] mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4">
          <h2 className="section-title">Latest products</h2>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0" role="group" aria-label="Filter by category">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 border ${
                  activeTab === tab.id
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <ProductGrid products={featured} isLoading={isLoading} skeletons={10} />

        {!isLoading && featured.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-14">
            {products.length === 0
              ? "We could not load products just now. Please refresh in a moment."
              : "Nothing in this category yet."}
          </p>
        )}

        <div className="text-center pt-8">
          <Link href="/products" className="btn-secondary px-6 py-2.5 text-sm">
            View all products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Visit us */}
      {offices.length > 0 && (
        <section className="max-w-[1600px] mx-auto px-4">
          <div className="surface p-5 sm:p-7 grid md:grid-cols-[1fr_2fr] gap-6">
            <div>
              <h2 className="section-title">Visit or call us</h2>
              {settings?.hotlineNumber && (
                <a href={`tel:${settings.hotlineNumber}`} className="inline-flex items-center gap-2 mt-3 font-semibold text-foreground hover:text-primary tabular-nums">
                  <Phone className="w-4 h-4" />
                  {settings.hotlineNumber}
                </a>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {offices.map((office) => (
                <div key={office.name} className="flex gap-3">
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{office.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{office.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
