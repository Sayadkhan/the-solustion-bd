"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { PageLoader } from "@/components/page-loader";
import {
  getAdminUser,
  isAuthenticated,
  canAccessPath,
  clearAdminSession,
  AdminUser,
} from "@/lib/auth";
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
  ImageIcon,
  BarChart3,
  LogOut,
  Crown,
  Search,
  ShieldAlert,
  ArrowRight,
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
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    const currentUser = getAdminUser();
    setUser(currentUser);

    // Check if current user has permission to view this route
    if (!canAccessPath(pathname, currentUser)) {
      setIsForbidden(true);
    } else {
      setIsForbidden(false);
    }

    setAuthChecked(true);
  }, [pathname, router]);

  const handleLogout = () => {
    clearAdminSession();
    router.push("/login");
  };

  // Role-based navigation items
  const isSeoSubAdmin = user?.role === "SEO_MANAGER";

  const allNavItems = [
    {
      name: "Dashboard",
      badge: isSeoSubAdmin ? "SEO Hub" : "Overview",
      href: "/",
      icon: LayoutDashboard,
      activePattern: /^\/$/,
      roles: ["SUPER_ADMIN", "ADMIN", "SEO_MANAGER"],
    },
    {
      name: "Tech Blogs",
      badge: "SEO",
      href: "/blogs",
      icon: FileText,
      activePattern: /^\/blogs/,
      roles: ["SUPER_ADMIN", "ADMIN", "SEO_MANAGER"],
    },
    {
      name: "SEO & Tag Manager",
      badge: "GTM",
      href: "/seo",
      icon: Tag,
      activePattern: /^\/seo/,
      roles: ["SUPER_ADMIN", "ADMIN", "SEO_MANAGER"],
    },
    {
      name: "Traffic & Analytics",
      badge: "Visitors",
      href: "/traffic",
      icon: BarChart3,
      activePattern: /^\/traffic/,
      roles: ["SUPER_ADMIN", "ADMIN", "SEO_MANAGER"],
    },
    {
      name: "Banners & Hero",
      badge: "Promos",
      href: "/banners",
      icon: ImageIcon,
      activePattern: /^\/banners/,
      roles: ["SUPER_ADMIN", "ADMIN", "SEO_MANAGER"],
    },
    {
      name: "Products",
      badge: "Inventory",
      href: "/products",
      icon: Package,
      activePattern: /^\/products/,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      name: "Main Categories",
      badge: "Root",
      href: "/categories",
      icon: Layers,
      activePattern: /^\/categories/,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      name: "Sub-Categories",
      badge: "Hierarchy",
      href: "/subcategories",
      icon: FolderTree,
      activePattern: /^\/subcategories/,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      name: "Brands",
      badge: "Partners",
      href: "/brands",
      icon: Tag,
      activePattern: /^\/brands/,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      name: "Orders & Invoices",
      badge: "POS",
      href: "/orders",
      icon: ShoppingCart,
      activePattern: /^\/orders/,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      name: "Serial & Warranty",
      badge: "RMA",
      href: "/serials",
      icon: ShieldCheck,
      activePattern: /^\/serials/,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      name: "Corporate Leads",
      badge: "B2B",
      href: "/leads",
      icon: Building2,
      activePattern: /^\/leads/,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      name: "Store Settings",
      badge: "Config",
      href: "/settings",
      icon: Settings,
      activePattern: /^\/settings/,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
  ];

  // Filter items matching user's current role
  const visibleNavItems = allNavItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );

  // If auth is not yet checked, render a loader
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="p-3 rounded-2xl bg-white shadow-lg border border-border">
          <img src="/logo.png" alt="The Solutions BD" className="h-8 w-auto object-contain animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Verifying Administrator Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row antialiased">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-3 border-b border-border bg-card">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-white shadow-sm border border-border shrink-0">
            <img src="/logo.png" alt="The Solutions BD" className="h-6 w-auto object-contain" />
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground">
            The Solutions BD <span className="text-primary text-xs font-semibold">Admin</span>
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
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 rounded-lg bg-white shadow-sm border border-border shrink-0 flex items-center justify-center">
              <img src="/logo.png" alt="The Solutions BD" className="h-7 w-auto object-contain" />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                The Solutions BD
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                {isSeoSubAdmin ? "SEO & Content Portal" : "Admin & POS Center"}
              </div>
            </div>
          </Link>
          <span
            className={`hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
              isSeoSubAdmin
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : "bg-primary/10 text-primary border-primary/20"
            }`}
          >
            {isSeoSubAdmin ? "SEO" : "v2.0"}
          </span>
        </div>

        {/* User Role Banner in Sidebar */}
        <div className="px-3 pt-3">
          <div
            className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
              isSeoSubAdmin
                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                : "bg-blue-500/5 border-blue-500/20 text-blue-400"
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {isSeoSubAdmin ? (
                <Search className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              ) : (
                <Crown className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              )}
              <span className="font-bold truncate text-[11px] text-foreground">
                {user?.name || "Logged In"}
              </span>
            </div>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold shrink-0 ${
                isSeoSubAdmin
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-blue-500/20 text-blue-400"
              }`}
            >
              {isSeoSubAdmin ? "SEO Sub-Admin" : "Super Admin"}
            </span>
          </div>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            {isSeoSubAdmin ? "SEO & Growth Tools" : "Management"}
          </div>

          {visibleNavItems.map((item) => {
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

        {/* Bottom Storefront & Logout Bar */}
        <div className="p-3 border-t border-border bg-muted/20 space-y-2">
          {/* Direct Storefront link */}
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2 rounded-lg border border-border bg-card hover:border-primary/50 text-xs font-medium text-foreground transition-all group"
          >
            <div className="flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
              <span>Live Storefront</span>
            </div>
            <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
          </a>

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-2 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-xs font-semibold transition-all group"
          >
            <div className="flex items-center gap-2">
              <LogOut className="w-3.5 h-3.5 text-red-500 group-hover:scale-110 transition-transform" />
              <span>Log Out</span>
            </div>
            <span className="text-[10px] font-mono text-red-400">Exit</span>
          </button>
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

          {/* Header Action Buttons & User Profile */}
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

            {/* Quick Profile Chip in Header */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
              <button
                onClick={handleLogout}
                title="Sign out of Admin"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:border-red-500/40 hover:bg-red-500/5 text-xs text-muted-foreground hover:text-red-500 transition-all font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content Body or Forbidden Banner */}
        <div className="flex-1 p-6 w-full space-y-6">
          {isForbidden ? (
            <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl border border-red-500/30 bg-red-500/5 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                Access Restricted (SEO Sub-Admin)
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your account is designated as an <strong className="text-foreground">SEO Sub-Admin</strong>.
                You have exclusive access to manage <strong>Tech Blogs</strong>, <strong>Google Tag Manager</strong>,
                <strong>SEO Metadata</strong>, and <strong>Traffic Analytics</strong>.
                Access to POS Orders, Financial Reports, and Product Inventory Pricing is restricted.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <Link
                  href="/seo"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-md shadow-primary/25"
                >
                  <span>Go to SEO & Tag Manager Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/blogs"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card text-foreground text-xs font-medium hover:bg-muted"
                >
                  <span>Manage Tech Blogs</span>
                </Link>
              </div>
            </div>
          ) : (
            <React.Suspense fallback={<PageLoader title="Loading section..." />}>
              {children}
            </React.Suspense>
          )}
        </div>
      </main>
    </div>
  );
}
