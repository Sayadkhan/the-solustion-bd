"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Gift,
  User,
  Cpu,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Flame,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { formatBdt } from "@solusation/shared-types";
import { ThemeToggle } from "@/components/theme-toggle";
import { storefrontApi, ApiCategory, ApiSiteSettings, normalizeImageUrl } from "@/lib/api";

// Fallback menu while the database categories load
const DEFAULT_MEGA_CATEGORIES = [
  {
    name: "Desktop",
    href: "/products?category=desktop",
    subcategories: [
      { name: "Special PC", href: "/products?category=desktop&sub=special-pc" },
      { name: "Gaming PC", href: "/products?category=desktop&sub=gaming-pc" },
      { name: "Brand PC (HP, Dell, Lenovo)", href: "/products?category=desktop&sub=brand-pc" },
      { name: "All-in-One PC", href: "/products?category=desktop&sub=all-in-one" },
      { name: "Apple Mac & Mini", href: "/products?category=desktop&sub=apple-mac" },
      { name: "Custom Rig PC", href: "/pc-builder" },
    ],
  },
  {
    name: "Laptop",
    href: "/products?category=laptop",
    subcategories: [
      { name: "All Laptops", href: "/products?category=laptop" },
      { name: "Gaming Laptop", href: "/products?category=laptop&sub=gaming-laptop" },
      { name: "ASUS ROG & TUF", href: "/products?category=laptop&sub=asus-rog" },
      { name: "Lenovo Legion & LOQ", href: "/products?category=laptop&sub=lenovo-legion" },
      { name: "Apple MacBook Air/Pro", href: "/products?category=laptop&sub=macbook" },
      { name: "Ultrabook & Business Laptop", href: "/products?category=laptop&sub=ultrabook" },
    ],
  },
  {
    name: "Component",
    href: "/products",
    badge: "Hot",
    subcategories: [
      { name: "Processor (CPU)", href: "/products?category=processor" },
      { name: "Motherboard", href: "/products?category=motherboard" },
      { name: "Graphics Card (GPU)", href: "/products?category=graphics-card" },
      { name: "RAM (Desktop & Laptop)", href: "/products?category=ram" },
      { name: "Power Supply (PSU)", href: "/products?category=power-supply" },
      { name: "Solid State Drive (SSD)", href: "/products?category=storage" },
      { name: "Hard Disk Drive (HDD)", href: "/products?category=storage" },
      { name: "Casing", href: "/products?category=casing" },
      { name: "CPU Cooler & Liquid AIO", href: "/products?category=cooler" },
      { name: "Casing Cooler Fan", href: "/products?category=cooler" },
    ],
  },
  {
    name: "Monitor",
    href: "/products?category=monitor",
    subcategories: [
      { name: "Gaming Monitor (144Hz - 360Hz)", href: "/products?category=monitor&sub=gaming" },
      { name: "4K & 2K QHD Monitor", href: "/products?category=monitor&sub=4k" },
      { name: "Curved Monitor", href: "/products?category=monitor&sub=curved" },
      { name: "OLED & Mini-LED Monitor", href: "/products?category=monitor&sub=oled" },
      { name: "Touch & Portable Monitor", href: "/products?category=monitor&sub=portable" },
    ],
  },
  {
    name: "Power & UPS",
    href: "/products?category=ups",
    subcategories: [
      { name: "Online UPS", href: "/products?category=ups&sub=online" },
      { name: "Offline UPS", href: "/products?category=ups&sub=offline" },
      { name: "Voltage Stabilizer", href: "/products?category=ups&sub=stabilizer" },
      { name: "Portable Power Station", href: "/products?category=ups&sub=power-station" },
    ],
  },
  {
    name: "Phone",
    href: "/products?category=phone",
    subcategories: [
      { name: "Apple iPhone", href: "/products?category=phone&sub=apple" },
      { name: "Samsung Galaxy", href: "/products?category=phone&sub=samsung" },
      { name: "Xiaomi & Redmi", href: "/products?category=phone&sub=xiaomi" },
      { name: "Feature Phones", href: "/products?category=phone&sub=feature" },
    ],
  },
  {
    name: "Tablet",
    href: "/products?category=tablet",
    subcategories: [
      { name: "Apple iPad", href: "/products?category=tablet&sub=ipad" },
      { name: "Samsung Galaxy Tab", href: "/products?category=tablet&sub=samsung-tab" },
      { name: "Graphics Tablet (Wacom, XP-Pen)", href: "/products?category=tablet&sub=graphics" },
    ],
  },
  {
    name: "Office Equipment",
    href: "/products?category=office",
    subcategories: [
      { name: "Laser & Inkjet Printer", href: "/products?category=office&sub=printer" },
      { name: "Scanner & Barcode Scanner", href: "/products?category=office&sub=scanner" },
      { name: "Projector & Screen", href: "/products?category=office&sub=projector" },
      { name: "Photocopier", href: "/products?category=office&sub=photocopier" },
    ],
  },
  {
    name: "Camera",
    href: "/products?category=camera",
    subcategories: [
      { name: "DSLR & Mirrorless Camera", href: "/products?category=camera&sub=mirrorless" },
      { name: "Action Camera (GoPro, DJI)", href: "/products?category=camera&sub=action" },
      { name: "Camera Lens & Gimbal", href: "/products?category=camera&sub=lens" },
    ],
  },
  {
    name: "Security",
    href: "/products?category=security",
    subcategories: [
      { name: "CC Camera & IP Camera", href: "/products?category=security&sub=cctv" },
      { name: "NVR & DVR", href: "/products?category=security&sub=nvr" },
      { name: "Smart Door Lock", href: "/products?category=security&sub=lock" },
    ],
  },
  {
    name: "Networking",
    href: "/products?category=networking",
    subcategories: [
      { name: "Wi-Fi 6 & 7 Router", href: "/products?category=networking&sub=router" },
      { name: "Mesh Wi-Fi System", href: "/products?category=networking&sub=mesh" },
      { name: "Network Switch", href: "/products?category=networking&sub=switch" },
      { name: "Access Point & Range Extender", href: "/products?category=networking&sub=ap" },
    ],
  },
  {
    name: "Software",
    href: "/products?category=software",
    subcategories: [
      { name: "Operating System (Windows 11)", href: "/products?category=software&sub=windows" },
      { name: "Antivirus & Internet Security", href: "/products?category=software&sub=antivirus" },
      { name: "Microsoft Office 365", href: "/products?category=software&sub=office" },
    ],
  },
  {
    name: "Accessories",
    href: "/products?category=accessories",
    subcategories: [
      { name: "Mechanical Keyboard", href: "/products?category=accessories&sub=keyboard" },
      { name: "Gaming Mouse", href: "/products?category=accessories&sub=mouse" },
      { name: "Headphone & Earphone", href: "/products?category=accessories&sub=headphone" },
      { name: "Mousepad & Deskmat", href: "/products?category=accessories&sub=mousepad" },
      { name: "USB Hub & Converters", href: "/products?category=accessories&sub=hub" },
    ],
  },
  {
    name: "Gadget",
    href: "/products?category=gadget",
    subcategories: [
      { name: "Smart Watch", href: "/products?category=gadget&sub=smart-watch" },
      { name: "Earbuds / TWS", href: "/products?category=gadget&sub=earbuds" },
      { name: "Power Bank", href: "/products?category=gadget&sub=power-bank" },
      { name: "Bluetooth Speaker", href: "/products?category=gadget&sub=speaker" },
    ],
  },
  {
    name: "Gaming",
    href: "/products?category=gaming",
    badge: "Sale",
    subcategories: [
      { name: "Gaming Chair & Desk", href: "/products?category=gaming&sub=chair" },
      { name: "Gaming Console (PS5, Xbox)", href: "/products?category=gaming&sub=console" },
      { name: "Gamepad & Joystick", href: "/products?category=gaming&sub=gamepad" },
      { name: "VR Headset (Meta Quest)", href: "/products?category=gaming&sub=vr" },
    ],
  },
  {
    name: "TV",
    href: "/products?category=tv",
    subcategories: [
      { name: "4K Google & Android TV", href: "/products?category=tv&sub=smart" },
      { name: "OLED & QLED TV", href: "/products?category=tv&sub=oled" },
      { name: "TV Wall Mount & Soundbar", href: "/products?category=tv&sub=soundbar" },
    ],
  },
  {
    name: "Appliance",
    href: "/products?category=appliance",
    subcategories: [
      { name: "Air Conditioner (Inverter AC)", href: "/products?category=appliance&sub=ac" },
      { name: "Air Fryer & Coffee Maker", href: "/products?category=appliance&sub=kitchen" },
      { name: "Refrigerator & Freezer", href: "/products?category=appliance&sub=fridge" },
    ],
  },
];

// Clean category display names (concise, sleek, no parentheses or long suffixes)
export function cleanCategoryLabel(rawName: string): string {
  if (!rawName) return "";
  let name = rawName.trim();
  // Strip parentheses and anything inside, e.g. "(CPU)", "(GPU)", "(PSU)", "(Memory)", "(SSD / HDD)"
  name = name.replace(/\s*\([^)]*\)/g, "").trim();

  const lower = name.toLowerCase();
  if (lower === "processors" || lower === "processor") return "Processor";
  if (lower === "motherboards" || lower === "motherboard") return "Motherboard";
  if (lower === "graphics cards" || lower === "graphics card") return "Graphics Card";
  if (lower === "power supplies" || lower === "power supply") return "Power Supply";
  if (lower === "cpu coolers" || lower === "cpu cooler" || lower === "cooling") return "Cooler";
  if (lower === "gaming monitors" || lower === "gaming monitor" || lower === "monitors") return "Monitor";
  if (lower === "casings" || lower === "casing") return "Casing";
  if (lower === "ram" || lower === "memory") return "RAM";
  if (lower === "storage") return "Storage";
  return name;
}

// Priority mapping for sorting PC hardware & electronics categories logically (Star Tech style)
const CATEGORY_PRIORITY: Record<string, number> = {
  processor: 1,
  motherboard: 2,
  "graphics-card": 3,
  ram: 4,
  storage: 5,
  "power-supply": 6,
  casing: 7,
  cooling: 8,
  cooler: 8,
  monitor: 9,
  desktop: 10,
  laptop: 11,
  component: 12,
  ups: 13,
  phone: 14,
  tablet: 15,
  office: 16,
  camera: 17,
  security: 18,
  networking: 19,
  software: 20,
  accessories: 21,
  gadget: 22,
  gaming: 23,
  tv: 24,
  appliance: 25,
};

interface NavCategoryItem {
  name: string;
  href: string;
  badge?: string;
  subcategories?: { name: string; href: string }[];
}

// Instant initial categories for SSR/hydration without layout shift
const INITIAL_HARDWARE_CATEGORIES: NavCategoryItem[] = [
  { name: "Processor", href: "/products?category=processor", badge: "Hot", subcategories: [] },
  { name: "Motherboard", href: "/products?category=motherboard", subcategories: [] },
  { name: "Graphics Card", href: "/products?category=graphics-card", subcategories: [] },
  { name: "RAM", href: "/products?category=ram", subcategories: [] },
  { name: "Storage", href: "/products?category=storage", subcategories: [] },
  { name: "Power Supply", href: "/products?category=power-supply", subcategories: [] },
  { name: "Casing", href: "/products?category=casing", subcategories: [] },
  { name: "Cooler", href: "/products?category=cooling", subcategories: [] },
  { name: "Monitor", href: "/products?category=monitor", subcategories: [] },
  { name: "Desktop", href: "/products?category=desktop", subcategories: [] },
  { name: "Laptop", href: "/products?category=laptop", subcategories: [] },
  { name: "Power & UPS", href: "/products?category=ups", subcategories: [] },
  { name: "Networking", href: "/products?category=networking", subcategories: [] },
  { name: "Accessories", href: "/products?category=accessories", subcategories: [] },
];

export function MainNavbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "");
  const [searchOpen, setSearchOpen] = useState(false);
  const [liveSearchResults, setLiveSearchResults] = useState<any[]>([]);
  const [navCategories, setNavCategories] = useState<NavCategoryItem[]>(INITIAL_HARDWARE_CATEGORIES);
  const [siteSettings, setSiteSettings] = useState<ApiSiteSettings | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const cartCount = useCartStore((s) => s.getItemCount());
  const cartCashTotal = useCartStore((s) => s.getTotalCashBdt());

  // Sync searchQuery with URL query parameter
  useEffect(() => {
    const q = searchParams?.get("q");
    if (q !== null && q !== undefined) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // 1. Fetch live categories & settings from backend on mount
  useEffect(() => {
    async function loadNavData() {
      try {
        const [catRes, settingsRes] = await Promise.all([
          storefrontApi.getCategories(),
          storefrontApi.getSettings(),
        ]);

        if (settingsRes) {
          setSiteSettings(settingsRes);
        }

        // If backend has categories, build dynamic hierarchy with clean names and priority sort
        if (catRes.main && catRes.main.length > 0) {
          // Filter out dummy test categories like "categorry-1"
          const validMain = catRes.main.filter(
            (c) =>
              !c.slug.toLowerCase().includes("categorry") &&
              !c.name.toLowerCase().includes("categorry") &&
              !c.slug.toLowerCase().includes("subcategory-1")
          );

          // Sort by PC hardware priority
          const sortedMain = [...validMain].sort((a, b) => {
            const pA = CATEGORY_PRIORITY[a.slug.toLowerCase()] ?? (a.sortOrder || 90);
            const pB = CATEGORY_PRIORITY[b.slug.toLowerCase()] ?? (b.sortOrder || 90);
            if (pA !== pB) return pA - pB;
            return a.name.localeCompare(b.name);
          });

          const dynamicMenu: NavCategoryItem[] = sortedMain.map((mainCat) => {
            const children = catRes.sub.filter((s) => s.parentId === mainCat.id);
            const cleanName = cleanCategoryLabel(mainCat.name);
            return {
              name: cleanName,
              href: `/products?category=${encodeURIComponent(mainCat.slug)}`,
              badge: mainCat.slug === "processor" ? "Hot" : undefined,
              subcategories:
                children.length > 0
                  ? children.map((c) => ({
                      name: cleanCategoryLabel(c.name),
                      href: `/products?category=${encodeURIComponent(
                        mainCat.slug
                      )}&sub=${encodeURIComponent(c.slug)}`,
                    }))
                  : [],
            };
          });

          // Merge any categories from default list if not already present
          const existingSlugs = new Set(validMain.map((m) => m.slug.toLowerCase()));
          const existingNames = new Set(validMain.map((m) => cleanCategoryLabel(m.name).toLowerCase()));
          const extraDefaults = DEFAULT_MEGA_CATEGORIES.filter(
            (def) =>
              !existingSlugs.has(def.name.toLowerCase()) &&
              !existingNames.has(def.name.toLowerCase())
          );

          setNavCategories([...dynamicMenu, ...extraDefaults]);
        }
      } catch (err) {
        console.warn("Failed to load live nav data:", err);
      }
    }

    loadNavData();
  }, []);

  // 2. Live database & catalog search query with debounce
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) {
      setLiveSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await storefrontApi.getProducts({ search: q, limit: 8 });
        if (results && results.length > 0) {
          const matched = results.filter((p: any) => {
            const name = (p.name || "").toLowerCase();
            const sku = (p.sku || "").toLowerCase();
            const brand = (typeof p.brand === "object" ? p.brand?.name : p.brand || "").toLowerCase();
            return name.includes(q) || sku.includes(q) || brand.includes(q);
          });
          if (matched.length > 0) {
            setLiveSearchResults(matched);
            return;
          }
        }

        setLiveSearchResults([]);
      } catch {
        setLiveSearchResults([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle outside click for search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDesktop = searchRef.current && searchRef.current.contains(target);
      const insideMobile = mobileSearchRef.current && mobileSearchRef.current.contains(target);
      if (!insideDesktop && !insideMobile) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const searchField = (ref: React.RefObject<HTMLDivElement | null>, id: string) => (
    <div ref={ref} className="relative w-full">
      <form onSubmit={handleSearchSubmit} role="search" className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          id={id}
          type="search"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => {
            if (searchQuery.trim().length >= 2) setSearchOpen(true);
          }}
          placeholder="Search processors, graphics cards, brands…"
          aria-label="Search products"
          className="w-full bg-muted/70 hover:bg-muted focus:bg-card text-foreground placeholder:text-muted-foreground pl-9 pr-9 py-2 text-sm rounded-lg border border-transparent focus:border-primary outline-none focus:ring-2 focus:ring-primary/15 transition-colors [&::-webkit-search-cancel-button]:hidden"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setLiveSearchResults([]);
              setSearchOpen(false);
            }}
            className="absolute right-2 p-1 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {searchOpen && liveSearchResults.length > 0 && (
        <div className="absolute top-full inset-x-0 mt-1.5 bg-popover text-foreground rounded-xl border border-border overflow-hidden z-50 divide-y divide-border max-h-[70vh] overflow-y-auto [box-shadow:var(--shadow-raised)]">
          {liveSearchResults.map((item) => {
            const brandName = typeof item.brand === "object" && item.brand !== null ? item.brand.name : item.brand || "";
            const thumb = normalizeImageUrl(item.thumbnailUrl || (Array.isArray(item.images) && item.images[0]));
            return (
              <Link
                key={item.id}
                href={`/products/${item.slug}`}
                onClick={() => setSearchOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors"
              >
                <span className="w-10 h-10 rounded-md bg-white p-1 shrink-0 flex items-center justify-center">
                  <img src={thumb} alt="" className="max-w-full max-h-full object-contain" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium line-clamp-1">{item.name}</span>
                  <span className="block text-xs text-muted-foreground truncate">{brandName}</span>
                </span>
                <span className="text-sm font-semibold tabular-nums shrink-0">
                  {formatBdt(item.cashPriceBdt || item.regularPriceBdt || 0)}
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleSearchSubmit}
            className="w-full p-2.5 text-sm font-medium text-primary hover:bg-muted flex items-center justify-center gap-1"
          >
            View all results
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );

  const logo = (
    <Link href="/" className="inline-flex shrink-0 rounded-md dark:bg-white dark:px-1.5 dark:py-0.5" aria-label="The Solutions BD home">
      <img src="/logo.png" alt="" className="h-8 lg:h-10 w-auto" />
    </Link>
  );

  const cartLink = (
    <Link
      href="/cart"
      aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
      className="relative p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
    >
      <ShoppingCart className="w-5 h-5" />
      {cartCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center tabular-nums">
          {cartCount}
        </span>
      )}
    </Link>
  );

  return (
    <header className="w-full z-40 sticky top-0 bg-card/95 backdrop-blur print:hidden">
      {/* Mobile */}
      <div className="lg:hidden px-3 py-2 space-y-2 h-[6.5rem]">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="p-2 -ml-1 rounded-lg text-foreground hover:bg-muted"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {logo}
          <div className="flex items-center">
            <ThemeToggle />
            {cartLink}
          </div>
        </div>
        {searchField(mobileSearchRef, "mobile-search")}
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center gap-5">
          {logo}
          <div className="flex-1 max-w-2xl">{searchField(searchRef, "desktop-search")}</div>

          <nav aria-label="Tools" className="ml-auto flex items-center gap-1 text-sm">
            <Link href="/products?deals=true" className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              Offers
            </Link>
            <Link href="/track-order" className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              Track order
            </Link>
            <Link href="/pc-builder" className="btn-primary px-3.5 py-2 mx-1">
              <Cpu className="w-4 h-4" />
              PC Builder
            </Link>
            {cartLink}
            <ThemeToggle />
          </nav>
        </div>

        <nav aria-label="Categories" className="border-t border-border">
          <ul className="max-w-[1600px] mx-auto px-2.5 h-10 flex items-center gap-0.5 text-[13px]">
            {navCategories.slice(0, 9).map((cat, idx) => (
              <li
                key={cat.name}
                onMouseEnter={() => setActiveDropdown(cat.name)}
                onMouseLeave={() => setActiveDropdown(null)}
                className={`relative ${idx >= 7 ? "hidden xl:block" : ""}`}
              >
                <Link
                  href={cat.href}
                  className="px-2.5 py-1.5 rounded-md font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  {cat.name}
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  )}
                </Link>

                {activeDropdown === cat.name && cat.subcategories && cat.subcategories.length > 0 && (
                  <div className="absolute top-full left-0 pt-1 z-50">
                    <div className="min-w-[230px] bg-popover border border-border rounded-xl py-1.5 [box-shadow:var(--shadow-raised)]">
                      {cat.subcategories.map((sub) => (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          onClick={() => setActiveDropdown(null)}
                          className="block px-3.5 py-1.5 text-sm text-foreground/85 hover:bg-muted hover:text-foreground transition-colors"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}

            {navCategories.length > 7 && (
              <li
                onMouseEnter={() => setActiveDropdown("__MORE__")}
                onMouseLeave={() => setActiveDropdown(null)}
                className="relative"
              >
                <button type="button" className="px-2.5 py-1.5 rounded-md font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1">
                  More
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>
                {activeDropdown === "__MORE__" && (
                  <div className="absolute top-full right-0 xl:right-auto xl:left-0 pt-1 z-50">
                    <div className="w-[240px] max-h-[380px] overflow-y-auto bg-popover border border-border rounded-xl py-1.5 [box-shadow:var(--shadow-raised)]">
                      {navCategories.slice(7, 9).map((cat) => (
                        <Link
                          key={`more-${cat.name}`}
                          href={cat.href}
                          onClick={() => setActiveDropdown(null)}
                          className="xl:hidden block px-3.5 py-1.5 text-sm text-foreground/85 hover:bg-muted hover:text-foreground"
                        >
                          {cat.name}
                        </Link>
                      ))}
                      {navCategories.slice(9).map((cat) => (
                        <Link
                          key={`more-${cat.name}`}
                          href={cat.href}
                          onClick={() => setActiveDropdown(null)}
                          className="block px-3.5 py-1.5 text-sm text-foreground/85 hover:bg-muted hover:text-foreground"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            )}
          </ul>
        </nav>
      </div>

      <div className="spectrum-line h-[2px]" />

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-card border-b border-border p-3 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 pb-3">
            <Link href="/products?deals=true" onClick={() => setMobileMenuOpen(false)} className="btn-secondary py-2 text-sm">
              Offers
            </Link>
            <Link href="/track-order" onClick={() => setMobileMenuOpen(false)} className="btn-secondary py-2 text-sm">
              Track order
            </Link>
          </div>
          <div className="eyebrow px-1 pb-1">Categories</div>
          <ul className="divide-y divide-border">
            {navCategories.map((cat) => {
              const isExpanded = expandedCat === cat.name;
              return (
                <li key={cat.name}>
                  <div className="flex items-center justify-between">
                    <Link href={cat.href} onClick={() => setMobileMenuOpen(false)} className="flex-1 py-2.5 px-1 text-sm font-medium text-foreground">
                      {cat.name}
                    </Link>
                    {cat.subcategories && cat.subcategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedCat(isExpanded ? null : cat.name)}
                        aria-expanded={isExpanded}
                        aria-label={`Show ${cat.name} subcategories`}
                        className="p-2 text-muted-foreground"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>
                  {isExpanded && cat.subcategories && (
                    <div className="pb-2 pl-3 space-y-0.5">
                      {cat.subcategories.map((sub) => (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1.5 text-sm text-muted-foreground hover:text-foreground"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
