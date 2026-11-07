"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Phone,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Box,
  Mail,
} from "lucide-react";
import { storefrontApi } from "@/lib/api";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any | null>(null);

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const data = await storefrontApi.trackOrder(orderNumber, phone);
      if (data) {
        setOrder(data);
      } else {
        setError("No order matches this invoice number and mobile number. Please check both and try again.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to find order details. Please verify your invoice number.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status?: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return 1;
      case "CONFIRMED":
        return 2;
      case "DISPATCHED":
        return 3;
      case "DELIVERED":
        return 4;
      case "CANCELLED":
        return -1;
      default:
        return 2;
    }
  };

  const activeStatus = order?.orderStatus || order?.status || "CONFIRMED";
  const currentStep = order ? getStatusStep(activeStatus) : 0;

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-semibold">Track Order</span>
        </nav>

        {/* Hero Card */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 sm:p-10 mb-8">
          <div className="max-w-xl mx-auto text-center mb-8">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
              <Truck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
              Track Your Order Status
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your Invoice Number (e.g. <span className="font-mono text-primary font-bold">SOL-2026-A1B2C3D4</span>) and the mobile number used on the order.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleTrack} className="max-w-lg mx-auto flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Invoice Number (SOL-...)"
                className="w-full pl-11 pr-4 py-3 text-sm bg-background border border-border rounded-xl font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              />
            </div>
            <div className="relative flex-1">
              <Phone className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile (01XXXXXXXXX)"
                className="w-full pl-11 pr-4 py-3 text-sm bg-background border border-border rounded-xl font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !orderNumber.trim() || !phone.trim()}
              className="px-6 py-3 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl text-sm font-bold disabled:opacity-50 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Track Order
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="max-w-lg mx-auto mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Order Not Found</p>
                <p className="text-xs mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Live Order Details Result */}
        {order && (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 sm:p-8 animate-in fade-in duration-300">
            {/* Header / Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h2 className="text-lg font-bold text-foreground">Invoice #{order.invoiceNo || order.orderNumber}</h2>
                  <span
                    className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      activeStatus === "DELIVERED"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                        : activeStatus === "DISPATCHED"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-primary"
                        : activeStatus === "CANCELLED"
                        ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                    }`}
                  >
                    {activeStatus}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Placed on: {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-xs text-muted-foreground">Total Payable</div>
                <div className="text-xl font-bold text-primary">৳{(order.totalPayableBdt || order.totalAmount || 0).toLocaleString()}</div>
                <div className="text-[11px] text-muted-foreground">Payment: {order.paymentMethod || "CASH_ON_DELIVERY"}</div>
              </div>
            </div>

            {/* Stepper Progress */}
            {currentStep > 0 && (
              <div className="py-8 border-b border-border">
                <div className="grid grid-cols-4 gap-2 relative">
                  {/* Progress Line */}
                  <div className="absolute top-5 left-1/8 right-1/8 h-1 bg-slate-200 dark:bg-muted -z-0">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((currentStep - 1) / 3) * 100))}%`,
                      }}
                    />
                  </div>

                  {/* Step 1 */}
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-colors ${
                        currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-foreground">Order Placed</span>
                    <span className="text-[11px] text-muted-foreground hidden sm:block">Received in system</span>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-colors ${
                        currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-foreground">Verified</span>
                    <span className="text-[11px] text-muted-foreground hidden sm:block">QC & Packaging</span>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-colors ${
                        currentStep >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Truck className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-foreground">Dispatched</span>
                    <span className="text-[11px] text-muted-foreground hidden sm:block">With Courier</span>
                  </div>

                  {/* Step 4 */}
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-colors ${
                        currentStep >= 4 ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-foreground">Delivered</span>
                    <span className="text-[11px] text-muted-foreground hidden sm:block">Received by Customer</span>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping & Customer Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              <div className="space-y-3 bg-slate-50 dark:bg-muted/40 p-4 rounded-xl border border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  Delivery & Contact
                </h3>
                <div className="text-sm font-bold text-foreground">{order.customerName}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  {order.customerPhone || order.phone}
                </div>
                {(order.customerEmail || order.email) && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    {order.customerEmail || order.email}
                  </div>
                )}
                <div className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                  {order.address}, {order.area ? `${order.area}, ` : ""}{order.district}
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 dark:bg-muted/40 p-4 rounded-xl border border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-primary" />
                  Order Summary
                </h3>
                <div className="divide-y divide-border">
                  {order.items?.map((item: any, idx: number) => {
                    const quantity = item.qty || item.quantity || 1;
                    const price = item.unitPriceBdt || item.priceBdt || 0;
                    return (
                      <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-foreground">{item.productName || item.sku}</span>
                          <span className="text-muted-foreground ml-1.5">x{quantity}</span>
                        </div>
                        <span className="font-bold text-foreground">৳{(price * quantity).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Helpline Footer */}
            <div className="mt-8 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Have any questions about this order? Call our 24/7 Helpline: <strong className="text-foreground">01711-319090</strong></span>
              <Link href="/" className="text-primary font-bold hover:underline flex items-center gap-1">
                Continue Shopping <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
