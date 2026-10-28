"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { CATALOG_PRODUCTS, Product } from "@/lib/catalog";
import { ThemeToggle } from "@/components/theme-toggle";
import { storefrontApi, ApiCategory, ApiSiteSettings } from "@/lib/api";

// Default Star Tech Categories (Fallback if database is empty or loading)
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

export function MainNavbar() {
  const router = useRouter();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [liveSearchResults, setLiveSearchResults] = useState<any[]>([]);
  const [navCategories, setNavCategories] = useState(DEFAULT_MEGA_CATEGORIES.slice(0, 10));
  const [siteSettings, setSiteSettings] = useState<ApiSiteSettings | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const cartCount = useCartStore((s) => s.getItemCount());
  const cartCashTotal = useCartStore((s) => s.getTotalCashBdt());

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

        // If backend has categories, build dynamic hierarchy (already ordered by sortOrder)
        if (catRes.main && catRes.main.length > 0) {
          const dynamicMenu = catRes.main.map((mainCat) => {
            const children = catRes.sub.filter((s) => s.parentId === mainCat.id);
            return {
              name: mainCat.name,
              href: `/products?category=${encodeURIComponent(mainCat.slug)}`,
              badge: mainCat.slug === "processor" ? "Hot" : undefined,
              subcategories:
                children.length > 0
                  ? children.map((c) => ({
                      name: c.name,
                      href: `/products?category=${encodeURIComponent(
                        mainCat.slug
                      )}&sub=${encodeURIComponent(c.slug)}`,
                    }))
                  : [
                      {
                        name: `All ${mainCat.name}`,
                        href: `/products?category=${encodeURIComponent(mainCat.slug)}`,
                      },
                    ],
            };
          });

          // Merge any categories from default list if fewer than 10 in database
          const existingSlugs = new Set(catRes.main.map((m) => m.slug.toLowerCase()));
          const extraDefaults = DEFAULT_MEGA_CATEGORIES.filter(
            (def) => !existingSlugs.has(def.name.toLowerCase())
          );

          // Strictly keep exactly 10 categories ordered by serial
          setNavCategories([...dynamicMenu, ...extraDefaults].slice(0, 10));
        }
      } catch (err) {
        console.warn("Failed to load live nav data:", err);
      }
    }

    loadNavData();
  }, []);

  // 2. Live database search query with debounce
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setLiveSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await storefrontApi.getProducts({ search: searchQuery.trim(), limit: 6 });
        if (results && results.length > 0) {
          setLiveSearchResults(results);
        } else {
          // Fallback to local catalog
          const fallback = CATALOG_PRODUCTS.filter(
            (p) =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
          ).slice(0, 6);
          setLiveSearchResults(fallback);
        }
      } catch {
        const fallback = CATALOG_PRODUCTS.filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 6);
        setLiveSearchResults(fallback);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle outside click for search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="w-full z-40 sticky top-0 shadow-md">
      {/* 1. Mobile Top Header Bar (Clean White) */}
      <div className="lg:hidden bg-white text-slate-900 px-3 py-2.5 flex items-center justify-between border-b border-slate-200 shadow-sm">
        {/* Left: Hamburger menu toggle */}
        <button
          onClick={() => {
            setMobileMenuOpen(!mobileMenuOpen);
            if (mobileSearchOpen) setMobileSearchOpen(false);
          }}
          className="p-1.5 text-slate-800 hover:text-blue-600 transition-colors focus:outline-none"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Center: Logo */}
        <Link href="/" className="flex items-center">
          <img
            src="/logo.png"
            alt="The Solutions BD"
            className="h-7 w-auto object-contain"
          />
        </Link>

        {/* Right: Search icon and Cart icon with red badge */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setMobileSearchOpen(!mobileSearchOpen);
              if (mobileMenuOpen) setMobileMenuOpen(false);
            }}
            className={`p-1.5 rounded transition-colors ${
              mobileSearchOpen ? "text-blue-600 bg-slate-100" : "text-slate-800 hover:text-blue-600"
            }`}
            aria-label="Toggle Search"
          >
            <Search className="w-5 h-5" />
          </button>

          <Link
            href="/cart"
            className="p-1.5 text-slate-800 hover:text-blue-600 relative transition-colors"
            title="Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow">
              {cartCount}
            </span>
          </Link>
        </div>
      </div>

      {/* Mobile Expandable Search Bar */}
      {mobileSearchOpen && (
        <div className="lg:hidden bg-slate-50 p-2.5 border-b border-slate-200 shadow-sm animate-in slide-in-from-top-1 duration-150">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              placeholder="Search components, laptops, gaming rigs..."
              className="w-full bg-white text-slate-900 placeholder-slate-400 pl-3.5 pr-10 py-2 text-xs rounded-md border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-slate-500 hover:text-blue-600"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Mobile Live Search Dropdown */}
          {searchOpen && liveSearchResults.length > 0 && (
            <div className="mt-2 bg-white text-slate-900 rounded-lg shadow-2xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {liveSearchResults.map((item) => (
                <Link
                  key={item.id}
                  href={`/products/${item.slug}`}
                  onClick={() => {
                    setSearchOpen(false);
                    setMobileSearchOpen(false);
                  }}
                  className="flex items-center justify-between p-2.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      className="w-8 h-8 object-contain rounded bg-slate-100 p-0.5"
                    />
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-900 line-clamp-1">{item.name}</span>
                      <span className="text-[10px] text-slate-500">{item.brand} • SKU: {item.sku}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-rose-600 shrink-0 ml-2">{formatBdt(item.cashPriceBdt)}</span>
                </Link>
              ))}
              <div className="p-2 text-center bg-slate-50">
                <button
                  onClick={handleSearchSubmit}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <span>View all matching results</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Desktop Main Header Bar (Hidden on Mobile) */}
      <div className="hidden lg:block bg-white text-slate-900 py-3 px-4 border-b border-slate-200/80 shadow-sm transition-colors">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* Logo - Sitting naturally on clean white background */}
          <Link href="/" className="flex items-center shrink-0 group py-0.5">
            <img
              src="/logo.png"
              alt="The Solutions BD - An Incomparable IT Solution Provider"
              className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Search Bar (Star Tech Style) */}
          <div ref={searchRef} className="flex-1 max-w-2xl mx-6 relative">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search components, laptops, gaming rigs..."
                className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-900 placeholder-slate-400 pl-4 pr-12 py-2.5 text-sm rounded-md border border-slate-300 focus:border-blue-600 outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 bottom-0 px-3.5 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Live Autocomplete Results */}
            {searchOpen && liveSearchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white text-slate-900 rounded-lg shadow-2xl border border-slate-200 overflow-hidden z-50 divide-y divide-slate-100 animate-in fade-in duration-150">
                <div className="px-4 py-2 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Products ({liveSearchResults.length})
                </div>
                {liveSearchResults.map((item) => (
                  <Link
                    key={item.id}
                    href={`/products/${item.slug}`}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.name}
                        className="w-10 h-10 object-contain rounded bg-slate-100 p-1 shrink-0"
                      />
                      <div className="text-left">
                        <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {item.brand} • SKU: {item.sku}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-blue-600">
                        {formatBdt(item.cashPriceBdt)}
                      </div>
                      <span className="text-[9px] text-emerald-600 font-medium">In Stock</span>
                    </div>
                  </Link>
                ))}
                <div className="p-2 text-center bg-slate-50">
                  <button
                    onClick={handleSearchSubmit}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <span>View all matching items</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Header Navigation Icons */}
          <div className="flex items-center gap-6 shrink-0">
            {/* Offers */}
            <Link
              href="/products?deals=true"
              className="flex items-center gap-2 hover:text-blue-600 transition-colors group text-left"
            >
              <div className="p-2 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Gift className="w-4 h-4" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-slate-900 text-sm">Offers</span>
                <span className="text-[11px] text-slate-500">Latest Deals</span>
              </div>
            </Link>

            {/* Account */}
            <Link
              href="/cart"
              className="flex items-center gap-2 hover:text-blue-600 transition-colors group text-left"
            >
              <div className="p-2 rounded-full bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-slate-900 text-sm">Account</span>
                <span className="text-[11px] text-slate-500">Register / Login</span>
              </div>
            </Link>

            {/* Star Tech Signature Royal Blue PC Builder Button */}
            <Link
              href="/pc-builder"
              className="bg-[#1340b8] hover:bg-blue-800 text-white font-bold px-4 py-2.5 rounded text-sm flex items-center gap-2 shadow-sm hover:shadow transition-all"
            >
              <Cpu className="w-4 h-4" />
              <span>PC Builder</span>
            </Link>

            {/* Cart Header Button */}
            <Link
              href="/cart"
              className="relative p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center justify-center border border-slate-200"
              title="View Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </Link>

            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* 3. Horizontal Category Mega Menu Bar (Desktop Only) */}
      <nav className="bg-[#081621] text-white border-b border-slate-900 hidden lg:block font-semibold text-sm relative shadow-md">
        <div className="max-w-[1440px] mx-auto px-4 flex items-center justify-center">
          <ul className="flex items-center justify-center gap-1 lg:gap-2 xl:gap-3">
            {navCategories.slice(0, 10).map((cat) => (
              <li
                key={cat.name}
                onMouseEnter={() => setActiveDropdown(cat.name)}
                onMouseLeave={() => setActiveDropdown(null)}
                className="relative py-2.5"
              >
                <Link
                  href={cat.href}
                  className="px-3 py-1.5 rounded text-slate-200 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap text-[13.5px] lg:text-sm font-semibold"
                >
                  <span>{cat.name}</span>
                  {cat.badge && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase leading-none shadow-sm">
                      {cat.badge}
                    </span>
                  )}
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform" />
                  )}
                </Link>

                {/* Subcategory Dropdown Panel */}
                {activeDropdown === cat.name && cat.subcategories && (
                  <div className="absolute top-full left-0 min-w-[280px] bg-[#0c1926] border border-slate-700 shadow-2xl rounded-b-md z-50 py-2 divide-y divide-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {cat.name} Categories
                    </div>
                    <div className="py-1">
                      {cat.subcategories.map((sub) => (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          onClick={() => setActiveDropdown(null)}
                          className="block px-4 py-2.5 text-sm font-normal text-slate-200 hover:bg-slate-800 hover:text-blue-400 transition-colors"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* 4. Mobile Navigation Drawer (Clean White) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white text-slate-900 border-b border-slate-200 p-4 max-h-[85vh] overflow-y-auto space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-xl">
          {/* Top Quick Actions */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Navigation Menu</span>
            <Link
              href="/pc-builder"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-[#1340b8] hover:bg-blue-800 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 shadow"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>PC Builder</span>
            </Link>
          </div>

          {/* Quick links: Offers */}
          <div className="pb-3 border-b border-slate-100 text-xs">
            <Link
              href="/products?deals=true"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80 font-medium"
            >
              <Gift className="w-4 h-4 text-blue-600" />
              <span>Exclusive Offers & Deals</span>
            </Link>
          </div>

          {/* Category Tree with Expandable Subcategories */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1 pb-1">
              All Categories
            </div>
            {navCategories.map((cat) => {
              const isExpanded = expandedCat === cat.name;
              return (
                <div key={cat.name} className="border-b border-slate-100 pb-1">
                  <div className="flex items-center justify-between py-2 px-1">
                    <Link
                      href={cat.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm font-semibold text-slate-800 hover:text-blue-600 flex items-center gap-2"
                    >
                      <span>{cat.name}</span>
                      {cat.badge && (
                        <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                          {cat.badge}
                        </span>
                      )}
                    </Link>
                    {cat.subcategories && cat.subcategories.length > 0 && (
                      <button
                        onClick={() => setExpandedCat(isExpanded ? null : cat.name)}
                        className="p-1 text-slate-400 hover:text-slate-700"
                        aria-label="Toggle subcategories"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180 text-blue-600" : ""}`} />
                      </button>
                    )}
                  </div>
                  {isExpanded && cat.subcategories && (
                    <div className="pl-4 pb-2 space-y-1 text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 mt-1 border border-slate-100">
                      {cat.subcategories.map((sub) => (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1 hover:text-blue-600 text-slate-700"
                        >
                          • {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Theme Switcher in Drawer */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
            <span>Color Theme</span>
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
