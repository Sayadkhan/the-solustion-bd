"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { Pagination } from "@/components/pagination";
import { adminApi } from "@/lib/api-client";
import { formatBdt } from "@solusation/shared-types";
import { InvoiceModal } from "@/components/invoice-modal";
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Package,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  Printer,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  ExternalLink,
  DollarSign,
  ChevronRight,
  Filter,
  FileText,
  Tag,
  BarChart3,
  Users,
  Eye,
  Sparkles,
  Globe,
  Layers,
  ArrowRight,
} from "lucide-react";
import { getAdminUser } from "@/lib/auth";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [blogsList, setBlogsList] = useState<any[]>([]);
  const [seoSettings, setSeoSettings] = useState<any>(null);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [serialsList, setSerialsList] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected invoice for modal
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);

  // Pagination for COD Verification Queue
  const [codPage, setCodPage] = useState(1);
  const [codPerPage, setCodPerPage] = useState(5);

  // Pagination for Recent Orders Table
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(5);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const usr = getAdminUser();
      setCurrentUser(usr);

      if (usr?.role === "SEO_MANAGER") {
        const [bRes, sRes] = await Promise.all([
          adminApi.getBlogs(),
          adminApi.getSettings(),
        ]);
        if (bRes?.items && Array.isArray(bRes.items)) setBlogsList(bRes.items);
        if (sRes?.data) setSeoSettings(sRes.data);
      } else {
        const [p, o, sers, bRes, sRes] = await Promise.all([
          adminApi.getProducts({ limit: 100 }),
          adminApi.getOrders({ limit: 50 }),
          adminApi.getSerials(),
          adminApi.getBlogs(),
          adminApi.getSettings(),
        ]);

        if (p?.data && Array.isArray(p.data)) setProductsList(p.data);
        if (o?.data && Array.isArray(o.data)) setOrdersList(o.data);
        if (sers?.data && Array.isArray(sers.data)) setSerialsList(sers.data);
        if (bRes?.items && Array.isArray(bRes.items)) setBlogsList(bRes.items);
        if (sRes?.data) setSeoSettings(sRes.data);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Financial calculations
  const totalRevenue = useMemo(() => {
    return ordersList
      .filter((o) => (o.orderStatus || o.status) !== "CANCELLED")
      .reduce((acc, curr) => acc + (curr.totalPayableBdt ?? curr.totalAmountBdt ?? 0), 0);
  }, [ordersList]);

  // Outside Dhaka COD Orders requiring ৳1,000 Advance Verification
  const outsideDhakaCodQueue = useMemo(() => {
    return ordersList.filter((o) => {
      const isOutside = o.isOutsideDhaka ?? (o.district && o.district.toLowerCase() !== "dhaka");
      const isVerified = o.advancePaymentVerified ?? ((o.paidAmountBdt || 0) >= 1000);
      const st = o.orderStatus || o.status || "PENDING";
      return isOutside && o.paymentMethod === "COD" && (!isVerified || st === "PENDING_DEPOSIT");
    });
  }, [ordersList]);

  // Low stock products count
  const lowStockCount = useMemo(() => {
    return productsList.filter((p) => {
      const stock = p.stock ?? p.inventory?.stock ?? 0;
      return stock <= 5;
    }).length;
  }, [productsList]);

  // Verify Outside-Dhaka COD Advance Deposit
  const handleVerifyCodDeposit = async (orderNumber: string) => {
    const trxId = prompt("Enter bKash/Nagad Deposit TrxID (Min. ৳1,000):", "TRX-" + Math.floor(100000 + Math.random() * 900000));
    if (!trxId) return;

    try {
      const res = await adminApi.verifyOrderDeposit(orderNumber, trxId, 1000);
      if (res?.success) {
        showToast(`Order #${orderNumber} advance deposit verified successfully!`);
        await loadData();
      } else {
        alert(res?.message || "Failed to verify deposit.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Status transition
  const handleStatusChange = async (orderNumber: string, newStatus: string) => {
    try {
      const res = await adminApi.updateOrderStatus(orderNumber, newStatus);
      if (res?.success) {
        showToast(`Order #${orderNumber} status updated to: ${newStatus}`);
        await loadData();
      } else {
        alert(res?.message || "Failed to update status.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Filtered orders list for table
  const filteredOrders = useMemo(() => {
    return ordersList.filter((ord) => {
      const ordStatus = ord.orderStatus || ord.status || "PENDING";
      if (orderStatusFilter !== "ALL" && ordStatus !== orderStatusFilter) {
        return false;
      }
      const q = orderSearch.toLowerCase();
      const invoiceNo = String(ord.invoiceNo || ord.orderNumber || ord.id || "").toLowerCase();
      const customerName = String(ord.customerName || "").toLowerCase();
      const customerPhone = String(ord.customerPhone || "").toLowerCase();
      return (
        invoiceNo.includes(q) ||
        customerName.includes(q) ||
        customerPhone.includes(q)
      );
    });
  }, [ordersList, orderStatusFilter, orderSearch]);

  // Paginated COD queue
  const paginatedCodQueue = useMemo(() => {
    const start = (codPage - 1) * codPerPage;
    return outsideDhakaCodQueue.slice(start, start + codPerPage);
  }, [outsideDhakaCodQueue, codPage, codPerPage]);

  // Paginated Orders
  const paginatedOrders = useMemo(() => {
    const start = (ordersPage - 1) * ordersPerPage;
    return filteredOrders.slice(start, start + ordersPerPage);
  }, [filteredOrders, ordersPage, ordersPerPage]);

  if (currentUser?.role === "SEO_MANAGER") {
    return (
      <AdminShell
        title="SEO & Growth Control Center"
        subtitle="Organic Search Presence, Google Tag Manager & Content Marketing"
        onRefresh={loadData}
        isRefreshing={loading}
      >
        {/* Toast alert */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-card border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-xl animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            {toastMessage}
          </div>
        )}

        {/* SEO Overview 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Monthly Visitors */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2 hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Monthly Traffic</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground tracking-tight">84,920</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% organic growth</span>
            </div>
          </div>

          {/* Google Organic Search Share */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2 hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Google Organic Share</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Globe className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground tracking-tight">58%</div>
            <div className="text-xs text-muted-foreground font-medium">49,250 direct Google visits</div>
          </div>

          {/* GTM Status */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2 hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Tag Manager Container</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <Tag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black font-mono text-foreground tracking-tight truncate">
              {seoSettings?.gtmId || "Not Connected"}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Link href="/seo" className="text-primary hover:underline flex items-center gap-1">
                <span>Manage GTM & GA4</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Active Blogs */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2 hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">SEO Tech Blogs</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground tracking-tight">
              {blogsList.length} Articles
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Link href="/blogs" className="text-primary hover:underline flex items-center gap-1">
                <span>Add / Edit Articles</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick SEO Operations Launchpad */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/blogs"
            className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">Write Tech Blog</div>
                <div className="text-[11px] text-muted-foreground">SEO articles & backlinks</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/seo"
            className="p-4 rounded-xl border border-border bg-card hover:border-purple-500/50 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">Google Tag Manager</div>
                <div className="text-[11px] text-muted-foreground">GTM, GA4 & Meta tags</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/traffic"
            className="p-4 rounded-xl border border-border bg-card hover:border-emerald-500/50 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">Traffic Analytics</div>
                <div className="text-[11px] text-muted-foreground">Pageviews, bounce & devices</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/banners"
            className="p-4 rounded-xl border border-border bg-card hover:border-amber-500/50 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">Hero Banners</div>
                <div className="text-[11px] text-muted-foreground">Campaign promo graphics</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* SEO Tech Blogs Table & Organic Keywords */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Blogs */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Latest SEO Blog Articles
              </h3>
              <Link href="/blogs" className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
                <span>View All ({blogsList.length})</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {blogsList.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No blog articles found. Create your first tech article!
                </div>
              ) : (
                blogsList.slice(0, 5).map((blog: any) => (
                  <div
                    key={blog.id || blog.slug}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-primary/40 transition-all"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="text-xs font-bold text-foreground truncate">{blog.title}</div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        /{blog.slug} • {blog.category || "Tech Guide"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                          blog.status === "PUBLISHED"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}
                      >
                        {blog.status}
                      </span>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {blog.viewCount || 0} views
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Organic Keywords */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-500" />
                Top Google Organic Search Terms
              </h3>
              <Link href="/traffic" className="text-xs text-emerald-500 hover:underline font-semibold flex items-center gap-1">
                <span>Full Analytics</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {[
                { kw: "ryzen 7 7800x3d price in bd", rank: "#1 on Google", volume: "4,230/mo", ctr: "18.4%" },
                { kw: "gaming pc build bangladesh", rank: "#2 on Google", volume: "3,890/mo", ctr: "15.2%" },
                { kw: "rtx 4070 ti super 16gb bd", rank: "#1 on Google", volume: "3,120/mo", ctr: "14.1%" },
                { kw: "the solutions bd idb shop", rank: "#1 on Google", volume: "2,950/mo", ctr: "28.6%" },
                { kw: "b650 gaming plus wifi bd", rank: "#3 on Google", volume: "1,940/mo", ctr: "11.5%" },
              ].map((item) => (
                <div key={item.kw} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 text-xs">
                  <div>
                    <div className="font-semibold text-foreground">{item.kw}</div>
                    <div className="text-[10px] text-emerald-500 font-medium">{item.rank}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-foreground">{item.volume}</div>
                    <div className="text-[10px] text-muted-foreground">CTR: {item.ctr}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Admin & POS Control Center"
      subtitle="Real-time Multi-branch Sales, Inventory & Analytics Dashboard"
      onRefresh={loadData}
      isRefreshing={loading}
    >
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-card border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          {toastMessage}
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Total Cash Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground tracking-tight">
            {formatBdt(totalRevenue)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Successful Sales Revenue</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground tracking-tight">
            {ordersList.length} Orders
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-2">
            <span>Pending: {ordersList.filter((o) => o.status === "PENDING").length}</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Low Stock Alerts</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-500 tracking-tight">
            {lowStockCount} Items
          </div>
          <Link
            href="/products"
            className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold mt-2 hover:underline"
          >
            <span>View Inventory</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Serial Warranty Tracker */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Tracked Serials</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground tracking-tight">
            {serialsList.length} Units
          </div>
          <Link
            href="/serials"
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold mt-2 hover:underline"
          >
            <span>Serial Warranty Center</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 7-Day Revenue Trend Chart */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Weekly Sales & Revenue Trend (BDT)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live revenue trajectory for the past 7 days
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-500">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Cash Sales
            </span>
          </div>
        </div>

        {/* SVG Curve Graphic */}
        <div className="h-44 w-full relative pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 700 130" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Area Fill */}
            <path
              d="M 0,110 Q 116,40 233,70 T 466,25 T 700,10 L 700,130 L 0,130 Z"
              fill="url(#chartGradient)"
            />
            {/* Line Path */}
            <path
              d="M 0,110 Q 116,40 233,70 T 466,25 T 700,10"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Data Dots */}
            <circle cx="0" cy="110" r="5" className="fill-primary" />
            <circle cx="116" cy="65" r="5" className="fill-primary" />
            <circle cx="233" cy="70" r="5" className="fill-primary" />
            <circle cx="350" cy="45" r="5" className="fill-primary" />
            <circle cx="466" cy="25" r="5" className="fill-primary" />
            <circle cx="583" cy="20" r="5" className="fill-primary" />
            <circle cx="700" cy="10" r="5" className="fill-primary" />
          </svg>
          <div className="flex justify-between text-[11px] font-mono text-muted-foreground pt-3 border-t border-border">
            <span>Sat</span>
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
          </div>
        </div>
      </div>

      {/* Outside Dhaka COD Verification Table with Pagination */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Outside Dhaka COD Verification Queue (Rule 4.5: ৳1,000 Advance Deposit)
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Mandatory ৳1,000 bKash/Nagad deposit verification required before confirming shipment.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500 font-bold border border-rose-500/20">
            Pending: {outsideDhakaCodQueue.length}
          </span>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="px-5 py-3">Order Number</th>
                  <th className="px-5 py-3">Customer & District</th>
                  <th className="px-5 py-3">Order Amount</th>
                  <th className="px-5 py-3">Required Deposit</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {paginatedCodQueue.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No pending Outside-Dhaka COD orders awaiting verification.
                    </td>
                  </tr>
                ) : (
                  paginatedCodQueue.map((ord) => {
                    const invoiceNo = ord.invoiceNo || ord.orderNumber || ord.id?.slice(0, 8) || "N/A";
                    const ordStatus = ord.orderStatus || ord.status || "PENDING";
                    const totalAmount = ord.totalPayableBdt ?? ord.totalAmountBdt ?? 0;
                    const district = ord.district || ord.deliveryDistrict || "Outside Dhaka";
                    return (
                      <tr key={ord.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-foreground">
                          #{invoiceNo}
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-foreground">{ord.customerName}</div>
                          <div className="text-[11px] text-muted-foreground">{district} • {ord.customerPhone}</div>
                        </td>
                        <td className="px-5 py-3 font-bold text-foreground">
                          {formatBdt(totalAmount)}
                        </td>
                        <td className="px-5 py-3 font-mono font-bold text-rose-500">
                          ৳ 1,000
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {ordStatus}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleVerifyCodDeposit(invoiceNo)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-all"
                          >
                            Verify Deposit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={codPage}
            totalPages={Math.ceil(outsideDhakaCodQueue.length / codPerPage) || 1}
            totalItems={outsideDhakaCodQueue.length}
            itemsPerPage={codPerPage}
            onPageChange={setCodPage}
            onItemsPerPageChange={setCodPerPage}
            pageSizeOptions={[5, 10]}
          />
        </div>
      </div>

      {/* Recent Orders Table with Pagination */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Recent POS & Online Orders
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search order no, customer..."
                value={orderSearch}
                onChange={(e) => {
                  setOrderSearch(e.target.value);
                  setOrdersPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <select
              value={orderStatusFilter}
              onChange={(e) => {
                setOrderStatusFilter(e.target.value);
                setOrdersPage(1);
              }}
              className="bg-card border border-border text-foreground rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="px-5 py-3">Order No</th>
                  <th className="px-5 py-3">Date & Customer</th>
                  <th className="px-5 py-3">Payment Method</th>
                  <th className="px-5 py-3">Total Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No orders found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((ord) => {
                    const invoiceNo = ord.invoiceNo || ord.orderNumber || ord.id?.slice(0, 8) || "N/A";
                    const ordStatus = ord.orderStatus || ord.status || "PENDING";
                    const totalAmount = ord.totalPayableBdt ?? ord.totalAmountBdt ?? 0;
                    return (
                      <tr key={ord.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-foreground">
                          #{invoiceNo}
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-foreground">{ord.customerName}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-5 py-3 font-mono font-semibold text-xs">
                          {ord.paymentMethod || "COD"}
                        </td>
                        <td className="px-5 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                          {formatBdt(totalAmount)}
                        </td>
                        <td className="px-5 py-3">
                          <select
                            value={ordStatus}
                            onChange={(e) => handleStatusChange(invoiceNo, e.target.value)}
                            className="bg-card border border-border text-foreground rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="PROCESSING">PROCESSING</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => setSelectedInvoiceOrder(ord)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5 text-primary" />
                            <span>Cash Memo</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={ordersPage}
            totalPages={Math.ceil(filteredOrders.length / ordersPerPage) || 1}
            totalItems={filteredOrders.length}
            itemsPerPage={ordersPerPage}
            onPageChange={setOrdersPage}
            onItemsPerPageChange={setOrdersPerPage}
            pageSizeOptions={[5, 10, 25]}
          />
        </div>
      </div>

      {/* POS Cash Memo / Tax Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </AdminShell>
  );
}
