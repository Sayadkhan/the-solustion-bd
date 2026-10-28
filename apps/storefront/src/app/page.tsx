"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Cpu,
  Monitor,
  Laptop,
  Layers,
  HardDrive,
  Zap,
  Box,
  Headphones,
  Gamepad2,
  Tv,
  Airplay,
  Clock,
  Sparkles,
  ShieldCheck,
  Truck,
  CreditCard,
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Flame,
  Search,
  Wrench,
  Calculator,
  MessageSquare,
  ArrowRight,
  Camera,
  Wifi,
  Watch,
  Smartphone,
} from "lucide-react";
import { formatBdt } from "@solusation/shared-types";
import { CATALOG_PRODUCTS, Product } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { storefrontApi, ApiSiteSettings, normalizeImageUrl } from "@/lib/api";

// Hero Slider Banners
const HERO_SLIDES = [
  {
    id: 1,
    tag: "10.10 MEGA SALE",
    title: "10.10 Tech Mega Sale!",
    subtitle: "Up to 40% Off on Gaming Laptops, RTX 40 Series & AMD AM5 BattleStations",
    bgGradient: "from-blue-700 via-indigo-900 to-slate-950",
    buttonText: "Shop Mega Deals",
    buttonLink: "/products?deals=true",
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1000&auto=format&fit=crop&q=80",
  },
  {
    id: 2,
    tag: "CUSTOM RIG SIMULATOR",
    title: "Build Your Dream BattleStation",
    subtitle: "Real-time TDP wattage check, 100% box serial warranty tracking & instant quotation",
    bgGradient: "from-blue-800 via-indigo-900 to-slate-950",
    buttonText: "Launch PC Builder",
    buttonLink: "/pc-builder",
    image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=1000&auto=format&fit=crop&q=80",
  },
  {
    id: 3,
    tag: "OFFICIAL WARRANTY",
    title: "AMD Ryzen 9000 & 7000X3D Series",
    subtitle: "Experience world-record FPS gaming with 3D V-Cache architecture in Bangladesh",
    bgGradient: "from-cyan-700 via-blue-900 to-slate-950",
    buttonText: "Explore Processors",
    buttonLink: "/products?category=processor",
    image: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=1000&auto=format&fit=crop&q=80",
  },
];

// Star Tech Style 16 Featured Categories
const FEATURED_CATEGORIES = [
  { name: "Processor (CPU)", icon: Cpu, count: "45+ Items", href: "/products?category=processor" },
  { name: "Graphics Card", icon: Layers, count: "38+ Items", href: "/products?category=graphics-card" },
  { name: "Motherboard", icon: Box, count: "52+ Items", href: "/products?category=motherboard" },
  { name: "Desktop RAM", icon: Box, count: "40+ Items", href: "/products?category=ram" },
  { name: "SSD & Storage", icon: HardDrive, count: "65+ Items", href: "/products?category=storage" },
  { name: "Power Supply", icon: Zap, count: "29+ Items", href: "/products?category=power-supply" },
  { name: "Gaming Casing", icon: Box, count: "34+ Items", href: "/products?category=casing" },
  { name: "Monitor", icon: Monitor, count: "48+ Items", href: "/products?category=monitor" },
  { name: "Gaming Laptop", icon: Laptop, count: "25+ Items", href: "/products?category=laptop" },
  { name: "Headphone", icon: Headphones, count: "30+ Items", href: "/products?category=accessories" },
  { name: "Smart Watch", icon: Watch, count: "22+ Items", href: "/products?category=gadget" },
  { name: "Wi-Fi Router", icon: Wifi, count: "18+ Items", href: "/products?category=networking" },
  { name: "Action Camera", icon: Camera, count: "15+ Items", href: "/products?category=camera" },
  { name: "Smartphone", icon: Smartphone, count: "20+ Items", href: "/products?category=phone" },
  { name: "Online UPS", icon: Zap, count: "14+ Items", href: "/products?category=ups" },
  { name: "Smart TV", icon: Tv, count: "16+ Items", href: "/products?category=tv" },
];

export default function StorefrontHomePage() {
  // Hero Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [siteSettings, setSiteSettings] = useState<ApiSiteSettings | null>(null);
  const [productsList, setProductsList] = useState<Product[]>(CATALOG_PRODUCTS);
  const [heroSlides, setHeroSlides] = useState<any[]>(HERO_SLIDES);
  const [promoSideBanners, setPromoSideBanners] = useState<any[]>([]);

  // Fetch live products, settings, and banners from API on mount
  useEffect(() => {
    async function loadLiveData() {
      try {
        const [liveProds, settings, banners] = await Promise.all([
          storefrontApi.getProducts({ limit: 40 }),
          storefrontApi.getSettings(),
          storefrontApi.getBanners(),
        ]);

        if (settings) {
          setSiteSettings(settings);
        }

        if (banners && banners.length > 0) {
          const hero = banners.filter((b) => b.type === "HERO" && b.isActive);
          if (hero.length > 0) {
            setHeroSlides(hero);
          }
          const side = banners.filter((b) => b.type === "PROMO_SIDE" && b.isActive);
          if (side.length > 0) {
            setPromoSideBanners(side);
          }
        }

        if (liveProds && liveProds.length > 0) {
          // Format live products to match frontend Product interface
          const formatted: Product[] = liveProds.map((p: any) => ({
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
            thumbnailUrl: normalizeImageUrl(p.thumbnailUrl || (Array.isArray(p.images) && p.images[0])),
            images: Array.isArray(p.images) && p.images.length > 0
              ? p.images.map((img: string) => normalizeImageUrl(img))
              : [normalizeImageUrl(p.thumbnailUrl)],
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
          }));

          setProductsList(formatted);
        }
      } catch (err) {
        console.warn("Failed to load live products or settings:", err);
      }
    }

    loadLiveData();
  }, []);

  // Auto rotate carousel every 5 seconds
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Flash Mega Deal Countdown State (5 Days)
  const [countdown, setCountdown] = useState({
    days: 5,
    hours: 23,
    minutes: 25,
    seconds: 37,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return { days: 5, hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter tab for Featured Products
  const [activeTab, setActiveTab] = useState("all");

  const filteredProducts =
    activeTab === "all"
      ? productsList
      : productsList.filter((p) => p.categorySlug === activeTab);

  const megaDealsList = productsList.slice(0, 5);

  return (
    <div className="bg-[#f2f4f8] dark:bg-[#070d12] text-slate-900 dark:text-slate-100 min-h-screen pb-16 space-y-8">
      {/* 1. Hero Campaign Section (Star Tech 2/3 + 1/3 Layout) */}
      <section className="max-w-[1600px] mx-auto px-4 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Left: 8 Cols Carousel Slider */}
          <div className="lg:col-span-8 relative rounded-xl overflow-hidden shadow-lg min-h-[220px] sm:min-h-[340px] md:min-h-[440px] flex items-center group">
            {heroSlides.map((slide, idx) => (
              <div
                key={slide.id || idx}
                className={`absolute inset-0 transition-opacity duration-700 bg-gradient-to-r ${
                  slide.bgGradient || "from-blue-700 via-indigo-900 to-slate-950"
                } flex items-center p-5 sm:p-10 text-white ${
                  idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <div className="relative z-10 max-w-lg space-y-4 text-left">
                  {slide.tag && (
                    <div className="inline-block bg-white/20 backdrop-blur-md text-white font-extrabold text-[11px] uppercase px-3 py-1 rounded-full border border-white/30">
                      {slide.tag}
                    </div>
                  )}
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                    {slide.title}
                  </h2>
                  {slide.subtitle && (
                    <p className="text-slate-200 text-xs sm:text-sm font-medium line-clamp-2 sm:line-clamp-3">
                      {slide.subtitle}
                    </p>
                  )}
                  <div className="pt-2">
                    <Link
                      href={slide.buttonLink || "/products"}
                      className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 font-extrabold px-6 py-3 rounded-md text-xs shadow-xl hover:scale-105 transition-all"
                    >
                      <span>{slide.buttonText || "Shop Now"}</span>
                      <ArrowRight className="w-4 h-4 text-blue-600" />
                    </Link>
                  </div>
                </div>

                {/* Banner Graphic Background Image */}
                {slide.image && (
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-30 md:opacity-50 overflow-hidden pointer-events-none">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Carousel Slider Controls */}
            {heroSlides.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
                  }
                  className="absolute left-3 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
                  className="absolute right-3 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Slider Dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                  {heroSlides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`h-2 rounded-full transition-all ${
                        i === currentSlide ? "w-8 bg-blue-600" : "w-2 bg-white/50"
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: 4 Cols Stacked Promo Banners (Hidden on Mobile, Visible on Desktop like Star Tech) */}
          <div className="hidden lg:flex lg:col-span-4 flex-col gap-4">
            {/* Promo Card 1: Blue Customer Care & After Sales */}
            <div className={`flex-1 rounded-xl p-6 bg-gradient-to-br ${
              promoSideBanners[0]?.bgGradient || "from-[#0e3c88] to-[#122444]"
            } text-white flex flex-col justify-between shadow-lg relative overflow-hidden group`}>
              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span>{promoSideBanners[0]?.tag || "Customer Support & RMA"}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black leading-snug">
                  {promoSideBanners[0]?.title || "Customer Support & RMA Inquiries"}
                </h3>
                <p className="text-slate-300 text-xs">
                  {promoSideBanners[0]?.subtitle || "Get genuine box serial warranty tracking and dedicated after-sales support."}
                </p>
              </div>
              <div className="relative z-10 pt-4">
                <Link
                  href={promoSideBanners[0]?.buttonLink || "/track-order"}
                  className="inline-block bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded text-xs shadow-md transition-colors"
                >
                  {promoSideBanners[0]?.buttonText || "Contact Support"}
                </Link>
              </div>
              {/* Background ambient shape */}
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            </div>

            {/* Promo Card 2: Deep Blue Corporate Solutions & PC Builder */}
            <div className={`flex-1 rounded-xl p-6 bg-gradient-to-br ${
              promoSideBanners[1]?.bgGradient || "from-[#1e3a8a] to-[#0f172a]"
            } text-white flex flex-col justify-between shadow-lg relative overflow-hidden group`}>
              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>{promoSideBanners[1]?.tag || "Custom Rig & B2B Solutions"}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black leading-snug">
                  {promoSideBanners[1]?.title || "Shape Your Dream Battlestation With Us!"}
                </h3>
                <p className="text-slate-300 text-xs">
                  {promoSideBanners[1]?.subtitle || "Official distributor warranty & nationwide fast delivery across Bangladesh."}
                </p>
              </div>
              <div className="relative z-10 pt-4">
                <Link
                  href={promoSideBanners[1]?.buttonLink || "/pc-builder"}
                  className="inline-block bg-white hover:bg-slate-100 text-blue-700 font-extrabold px-4 py-2 rounded text-xs shadow-md transition-colors"
                >
                  {promoSideBanners[1]?.buttonText || "Configure Rig Now"}
                </Link>
              </div>
              {/* Background ambient shape */}
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-500/15 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Scrolling Ticker Notice Bar (Star Tech Style) */}
      <section className="max-w-[1600px] mx-auto px-4">
        <div className="bg-white dark:bg-[#0c1319] border border-slate-200 dark:border-slate-800 rounded-full px-5 py-2.5 flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 font-normal truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-bold text-slate-900 dark:text-white">Notice:</span>
            <span className="truncate">
              {siteSettings?.headerNoticeText ||
                "All our 18+ physical outlets are open today including Multiplan, IDB Bhaban, Uttara & Chattogram branches. Express 2-4 hours delivery inside Dhaka & nationwide cash on delivery."}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400 shrink-0 hidden sm:inline ml-4">
            Hotline: {siteSettings?.hotlineNumber || "16793"}
          </span>
        </div>
      </section>

      {/* 3. Four Quick Service / Calculator Cards (Star Tech Style: 2 cols on mobile) */}
      <section className="max-w-[1600px] mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Card 1 */}
          <Link
            href="/products?category=laptop"
            className="bg-white dark:bg-[#0d1620] p-2.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 sm:gap-3.5 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all group"
          >
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Laptop className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-[15px] text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">
                Laptop Finder
              </h4>
              <p className="text-[10px] sm:text-xs font-normal text-slate-500 dark:text-slate-400 line-clamp-1 hidden sm:block">
                Find Your Desired Laptop Easily
              </p>
            </div>
          </Link>

          {/* Card 2 */}
          <Link
            href="/track-order"
            className="bg-white dark:bg-[#0d1620] p-2.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 sm:gap-3.5 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all group"
          >
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-[15px] text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">
                Raise a Complain
              </h4>
              <p className="text-[10px] sm:text-xs font-normal text-slate-500 dark:text-slate-400 line-clamp-1 hidden sm:block">
                Share your experience & RMA
              </p>
            </div>
          </Link>

          {/* Card 3 */}
          <Link
            href="/pc-builder"
            className="bg-white dark:bg-[#0d1620] p-2.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 sm:gap-3.5 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all group"
          >
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Calculator className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-[15px] text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">
                PC Wattage Calculator
              </h4>
              <p className="text-[10px] sm:text-xs font-normal text-slate-500 dark:text-slate-400 line-clamp-1 hidden sm:block">
                Find Perfect Power Supply
              </p>
            </div>
          </Link>

          {/* Card 4 */}
          <Link
            href="/track-order"
            className="bg-white dark:bg-[#0d1620] p-2.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 sm:gap-3.5 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all group"
          >
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Wrench className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-[15px] text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">
                Servicing Center
              </h4>
              <p className="text-[10px] sm:text-xs font-normal text-slate-500 dark:text-slate-400 line-clamp-1 hidden sm:block">
                Repair Your Device & Box S/N
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* 4. Featured Category 16-Grid (Exact Star Tech 4-Col Mobile Feature) */}
      <section className="max-w-[1600px] mx-auto px-4 pt-4">
        <div className="text-center space-y-1 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Featured Category
          </h2>
          <p className="text-[11px] sm:text-xs font-normal text-slate-500 dark:text-slate-400">
            Get Your Desired Product from Featured Category!
          </p>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-4">
          {FEATURED_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.name}
                href={cat.href}
                className="bg-white dark:bg-[#0d1620] rounded-xl border border-slate-200 dark:border-slate-800 p-2 sm:p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all group"
              >
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-200 group-hover:text-blue-600 group-hover:scale-110 transition-transform mb-1 sm:mb-2">
                  <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <span className="font-bold text-[10px] sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. 20+ Physical Stores Banner (Star Tech Signature Banner) */}
      <section className="max-w-[1600px] mx-auto px-4 pt-2">
        <div className="rounded-xl bg-gradient-to-r from-[#0372b0] via-[#0b4d9c] to-[#081621] p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black">20+ Physical Stores</h3>
              <p className="text-xs sm:text-sm text-slate-200">
                Visit Our Store & Get Your Desired IT Product!
              </p>
            </div>
          </div>
          <Link
            href="/track-order"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-full text-xs shadow-md transition-all shrink-0 flex items-center gap-1.5"
          >
            <span>Find Our Store</span>
            <Search className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 6. 10.10 Mega Deal / Flash Sale Countdown Grid (Star Tech Style) */}
      <section className="max-w-[1600px] mx-auto px-4 pt-4">
        <div className="bg-white dark:bg-[#0c1319] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-5 shadow-sm space-y-4 sm:space-y-5">
          {/* Section Header with Countdown Timer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-600 fill-red-600 animate-pulse" />
                <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
                  10.10 Mega Deal
                </h3>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Enjoy Exciting Discounts on your desired Products!
              </p>
            </div>

            {/* Countdown Boxes (Star Tech Style Badges) */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                Ending In:
              </span>
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <div className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded shadow-sm">
                  <span>{String(countdown.days).padStart(2, "0")}</span>
                  <span className="text-[9px] uppercase font-normal">Days</span>
                </div>
                <div className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded shadow-sm">
                  <span>{String(countdown.hours).padStart(2, "0")}</span>
                  <span className="text-[9px] uppercase font-normal">Hours</span>
                </div>
                <div className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded shadow-sm">
                  <span>{String(countdown.minutes).padStart(2, "0")}</span>
                  <span className="text-[9px] uppercase font-normal">Min</span>
                </div>
                <div className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded shadow-sm">
                  <span>{String(countdown.seconds).padStart(2, "0")}</span>
                  <span className="text-[9px] uppercase font-normal">Sec</span>
                </div>
              </div>
            </div>
          </div>

          {/* Deal Products Grid: 2 cols on mobile, multi-col on larger screens */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
            {megaDealsList.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 7. Featured Products Section with Tab Filter (Star Tech Style) */}
      <section className="max-w-[1600px] mx-auto px-4 pt-4">
        <div className="text-center space-y-1 mb-4 sm:mb-5">
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Featured Products
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            Check & Get Your Desired Product!
          </p>
        </div>

        {/* Filter Tab Chips */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 no-scrollbar">
          {[
            { id: "all", label: "All Hardware" },
            { id: "processor", label: "Processors" },
            { id: "graphics-card", label: "Graphics Cards" },
            { id: "motherboard", label: "Motherboards" },
            { id: "ram", label: "RAM / Memory" },
            { id: "storage", label: "SSD & Storage" },
            { id: "power-supply", label: "Power Supply" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white dark:bg-[#0d1620] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Featured Products Grid: 2 cols on mobile, multi-col on larger screens */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
          {filteredProducts.slice(0, 10).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center pt-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-[#081621] hover:bg-slate-900 text-white font-bold px-8 py-3 rounded-lg text-xs shadow-md transition-colors"
          >
            <span>View All Components & Rigs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 8. Trusted Online Shopping From Bangladesh (Star Tech Style SEO Block) */}
      <section className="max-w-[1600px] mx-auto px-4 pt-8">
        <div className="bg-white dark:bg-[#0c1319] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed shadow-sm">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            Trusted Online Computer & Tech Shopping in Bangladesh — The Solutions BD
          </h3>
          <p>
            The Solutions BD is committed to delivering the ultimate computing experience across
            Bangladesh. Whether you are assembling a top-tier esports battlestation, seeking high-performance
            AI/workstation servers, or purchasing genuine brand laptops, we guarantee 100% authentic
            box serial number warranty tracking and official distributor coverage.
          </p>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white pt-2">
            Best Price, Genuine Box S/N Warranty & 64 Districts Express Delivery
          </h4>
          <p>
            With our premier physical branches in IDB Bhaban, Multiplan Center, Uttara, and Agrabad
            Chattogram, customers can experience live hardware demonstrations or enjoy seamless online ordering
            with outside-Dhaka cash on delivery through Pathao and Steadfast courier services.
          </p>
        </div>
      </section>
    </div>
  );
}
