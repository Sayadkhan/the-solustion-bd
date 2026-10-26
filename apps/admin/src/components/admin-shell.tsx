"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { PageLoader } from "@/components/page-loader";
import {
  LayoutDashboard,
  Package,
  Layers,
  FolderTree,
  Tag,
  ShoppingCart,
  ShieldCheck,
  FileText,
  Building2,
  Settings,
  ExternalLink,
  RefreshCw,
  Menu,
  X,
  Store,
  ChevronRight,
} from "lucide-react";

interface AdminShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function AdminShell({
  children,
  title,
  subtitle,
  actions,
  onRefresh,
  isRefreshing = false,
}: AdminShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      badge: "Overview",
      href: "/",
      icon: LayoutDashboard,
      activePattern: /^\/$/,
    },
    {
      name: "Products",
      badge: "Inventory",
      href: "/products",
      icon: Package,
      activePattern: /^\/products/,
    },
    {
      name: "Main Categories",
      badge: "Root",
      href: "/categories",
      icon: Layers,
      activePattern: /^\/categories/,
    },
    {
      name: "Sub-Categories",
      badge: "Hierarchy",
      href: "/subcategories",
      icon: FolderTree,
      activePattern: /^\/subcategories/,
    },
    {
      name: "Brands",
      badge: "Partners",
      href: "/brands",
      icon: Tag,
      activePattern: /^\/brands/,
    },
    {
      name: "Orders & Invoices",
      badge: "POS",
      href: "/orders",
      icon: ShoppingCart,
      activePattern: /^\/orders/,
    },
    {
      name: "Serial & Warranty",
      badge: "RMA",
      href: "/serials",
      icon: ShieldCheck,
      activePattern: /^\/serials/,
    },
    {
      name: "Tech Blogs",
      badge: "SEO",
      href: "/blogs",
      icon: FileText,
      activePattern: /^\/blogs/,
    },
    {
      name: "Corporate Leads",
      badge: "B2B",
      href: "/leads",
      icon: Building2,
      activePattern: /^\/leads/,
    },
    {
      name: "Store Settings",
      badge: "Config",
      href: "/settings",
      icon: Settings,
      activePattern: /^\/settings/,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row antialiased">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-rose-400 flex items-center justify-center text-white font-black text-sm shadow">
            SB
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground">
            Solusation BD <span className="text-primary text-xs font-semibold">Admin</span>
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg border border-border text-foreground hover:bg-muted"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-card border-r border-border flex flex-col z-40 transition-transform duration-200 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Logo & Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-rose-400 flex items-center justify-center text-white font-black text-base shadow-md group-hover:scale-105 transition-transform">
              SB
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                The Solusation BD
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                Admin & POS Center
              </div>
            </div>
          </Link>
          <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
            v2.0
          </span>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Management
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.activePattern.test(pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive
                      ? "bg-white/20 text-white font-semibold"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.badge}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Bottom Storefront & POS Status Bar */}
        <div className="p-3 border-t border-border bg-muted/20 space-y-2">
          {/* Direct Storefront link */}
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card hover:border-primary/50 text-xs font-medium text-foreground transition-all group"
          >
            <div className="flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
              <span>Live Storefront</span>
            </div>
            <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
          </a>

          {/* Quick System Badge */}
          <div className="flex items-center justify-between px-2 py-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              PostgreSQL Connected
            </span>
            <span className="font-mono">Port 5432</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                Admin Center
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">{title}</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2 mt-0.5">
              {title}
              {subtitle && (
                <span className="text-xs font-normal text-muted-foreground hidden sm:inline">
                  — {subtitle}
                </span>
              )}
            </h1>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors disabled:opacity-50"
                title="Refresh Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}

            {actions}

            <ThemeToggle />
          </div>
        </header>

        {/* Page Content Body with Suspense Boundary */}
        <div className="flex-1 p-6 w-full space-y-6">
          <React.Suspense fallback={<PageLoader title="Loading section..." />}>
            {children}
          </React.Suspense>
        </div>
      </main>
    </div>
  );
}
