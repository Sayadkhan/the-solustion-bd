"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Trash2,
  ShoppingCart,
  ArrowRight,
  ShieldAlert,
  Truck,
  CheckCircle2,
  Cpu,
  User,
  Phone,
  MapPin,
  Banknote,
  ShieldCheck,
  Printer,
  PackageCheck,
  Building,
  AlertCircle,
  Loader2,
  ExternalLink,
  Mail,
} from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { formatBdt, calculateAdvanceDepositRequirement, isValidBdPhone } from "@solusation/shared-types";
import { storefrontApi } from "@/lib/api";
import { BkashModal } from "@/components/bkash-modal";

const BD_DISTRICTS = [
  "Dhaka",
  "Gazipur",
  "Narayanganj",
  "Chattogram",
  "Cox's Bazar",
  "Cumilla",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Rangpur",
  "Mymensingh",
  "Bogura",
  "Pabna",
  "Jessore",
  "Dinajpur",
  "Tangail",
  "Faridpur",
  "Kushtia",
  "Feni",
  "Brahmanbaria",
  "Noakhali",
  "Sunamganj",
  "Habiganj",
  "Moulvibazar",
  "Netrokona",
  "Jamalpur",
  "Sherpur",
  "Kishorganj",
  "Manikganj",
  "Munshiganj",
  "Narsingdi",
  "Gopalganj",
  "Madaripur",
  "Rajbari",
  "Shariatpur",
  "Bagerhat",
  "Chuadanga",
  "Jhenaidah",
  "Magura",
  "Meherpur",
  "Narail",
  "Satkhira",
  "Barguna",
  "Bhola",
  "Jhalokati",
  "Patuakhali",
  "Pirojpur",
  "Bandarban",
  "Chandpur",
  "Khagrachhari",
  "Lakshmipur",
  "Rangamati",
  "Joypurhat",
  "Naogaon",
  "Natore",
  "Chapainawabganj",
  "Sirajganj",
  "Gaibandha",
  "Kurigram",
  "Lalmonirhat",
  "Nilphamari",
  "Panchagarh",
  "Thakurgaon",
];

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotalCashBdt } = useCartStore();

  // Customer & Delivery Info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [district, setDistrict] = useState("Dhaka");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryZone, setDeliveryZone] = useState<"INSIDE_DHAKA" | "OUTSIDE_DHAKA">("INSIDE_DHAKA");

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BKASH">("COD");
  const [bkashTrxId, setBkashTrxId] = useState<string | null>(null);
  const [isBkashModalOpen, setIsBkashModalOpen] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

  const cashSubtotal = getTotalCashBdt();
  const deliveryFee = deliveryZone === "INSIDE_DHAKA" ? 70 : 140;
  const grandTotal = cashSubtotal + deliveryFee;

  // Handle District Change
  const handleDistrictChange = (selectedDistrict: string) => {
    setDistrict(selectedDistrict);
    if (selectedDistrict.toLowerCase() === "dhaka") {
      setDeliveryZone("INSIDE_DHAKA");
    } else {
      setDeliveryZone("OUTSIDE_DHAKA");
    }
  };

  // Handle Delivery Zone toggle
  const handleZoneChange = (zone: "INSIDE_DHAKA" | "OUTSIDE_DHAKA") => {
    setDeliveryZone(zone);
    if (zone === "INSIDE_DHAKA" && district !== "Dhaka") {
      setDistrict("Dhaka");
    } else if (zone === "OUTSIDE_DHAKA" && district === "Dhaka") {
      setDistrict("Chattogram");
    }
  };

  // Deposit check for high-value outside Dhaka COD
  const depositCheck = calculateAdvanceDepositRequirement({
    district: deliveryZone === "OUTSIDE_DHAKA" ? district : "Dhaka",
    totalBdt: grandTotal,
    paymentMethod: paymentMethod === "BKASH" ? "BKASH" : "COD",
  });

  const validateForm = () => {
    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage("Please enter your full name.");
      return false;
    }

    const cleanPhone = customerPhone.trim().replace(/[\s-]/g, "");
    if (!isValidBdPhone(cleanPhone)) {
      setErrorMessage("Please enter a valid Bangladeshi mobile number (e.g. 01712345678).");
      return false;
    }

    if (customerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail.trim())) {
        setErrorMessage("Please enter a valid email address (or leave it blank).");
        return false;
      }
    }

    if (!area.trim() || area.trim().length < 2) {
      setErrorMessage("Please enter your area or thana.");
      return false;
    }

    if (!address.trim() || address.trim().length < 5) {
      setErrorMessage("Please enter your detailed delivery address (house/road/block).");
      return false;
    }

    if (items.length === 0) {
      setErrorMessage("Your cart is empty. Please add items to proceed.");
      return false;
    }

    return true;
  };

  const handleBkashPaymentSuccess = async (trxId: string, paymentDetails: any) => {
    setBkashTrxId(trxId);
    setIsBkashModalOpen(false);
    await executeOrderPlacement(trxId);
  };

  const executeOrderPlacement = async (verifiedTrxId?: string | null) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const cleanPhone = customerPhone.trim().replace(/[\s-]/g, "");
    const formattedPhone = cleanPhone.startsWith("+88")
      ? cleanPhone
      : cleanPhone.startsWith("88")
      ? `+${cleanPhone}`
      : `+88${cleanPhone}`;

    const activeTrxId = verifiedTrxId || bkashTrxId;
    const isPayingWithBkash = paymentMethod === "BKASH";

    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: formattedPhone,
        customerEmail: customerEmail.trim() ? customerEmail.trim().toLowerCase() : null,
        district: district.trim(),
        area: area.trim(),
        address: `${address.trim()}${notes.trim() ? ` (Note: ${notes.trim()})` : ""}`,
        paymentMethod: isPayingWithBkash ? "BKASH" : "COD",
        pricingTierUsed: "CASH",
        totalPayableBdt: grandTotal,
        paidAmountBdt: isPayingWithBkash ? grandTotal : 0,
        dueAmountBdt: isPayingWithBkash ? 0 : grandTotal,
        trxId: isPayingWithBkash ? activeTrxId : null,
        orderStatus: isPayingWithBkash && activeTrxId ? "CONFIRMED" : "PENDING",
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.name,
          qty: i.quantity,
          unitPriceBdt: i.cashPriceBdt,
        })),
      };

      const res = await storefrontApi.createOrder(payload);

      if (res?.success && res.data) {
        setPlacedOrder({
          ...res.data,
          customerEmail: customerEmail.trim() || res.data.customerEmail,
          itemsSummary: items,
          deliveryFee,
          deliveryZone,
          paymentMethodUsed: isPayingWithBkash ? "BKASH" : "COD",
          trxId: activeTrxId || res.data.trxId,
        });
        clearCart();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setErrorMessage(res?.message || "Failed to place order. Please try again.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while placing order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) return;

    if (paymentMethod === "BKASH" && !bkashTrxId) {
      setIsBkashModalOpen(true);
      return;
    }

    await executeOrderPlacement();
  };

  // SUCCESS SCREEN
  if (placedOrder) {
    const isOrderBkash = placedOrder.paymentMethodUsed === "BKASH";

    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
        <div className="bg-card rounded-2xl border-2 border-emerald-500/30 p-6 sm:p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
            <PackageCheck className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Order Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              Thank you for your order!
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              {isOrderBkash
                ? "Your bKash payment has been verified successfully. Your order is confirmed and will be dispatched shortly."
                : "Your Cash on Delivery order has been received. Our team will contact you shortly to confirm delivery."}
            </p>
          </div>

          {/* Invoice & Status Header Box */}
          <div className="bg-muted/40 rounded-xl p-4 border border-border flex flex-wrap items-center justify-between gap-4 text-left">
            <div>
              <div className="text-xs text-muted-foreground font-medium">Invoice Number:</div>
              <div className="text-base font-black text-primary tracking-wide">
                #{placedOrder.invoiceNo}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground font-medium">Payment Method:</div>
              {isOrderBkash ? (
                <div className="text-sm font-bold text-[#E2136E] flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-[#E2136E] text-white rounded-full flex items-center justify-center text-[10px] font-black">
                    ৳
                  </div>
                  <span>bKash (Paid)</span>
                </div>
              ) : (
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4" />
                  <span>Cash on Delivery</span>
                </div>
              )}
            </div>

            <div>
              <div className="text-xs text-muted-foreground font-medium">Order Status:</div>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded border ${
                  isOrderBkash
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                }`}
              >
                {isOrderBkash ? "CONFIRMED" : placedOrder.orderStatus || "PENDING"}
              </span>
            </div>
          </div>

          {/* bKash Verified TrxID banner */}
          {isOrderBkash && placedOrder.trxId && (
            <div className="p-3 bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800/50 rounded-xl flex items-center justify-between text-xs text-left">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#E2136E]" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Transaction ID (TrxID):
                </span>
                <span className="font-black text-[#E2136E] tracking-wider text-sm">
                  {placedOrder.trxId}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#E2136E] text-white font-bold text-[10px]">
                VERIFIED
              </span>
            </div>
          )}

          {/* Customer & Delivery Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-xs bg-card p-4 rounded-xl border border-border">
            <div className="space-y-1.5">
              <div className="font-bold text-foreground text-sm flex items-center gap-1.5 text-primary">
                <User className="w-4 h-4" />
                <span>Customer Details:</span>
              </div>
              <p><span className="text-muted-foreground">Name:</span> <strong>{placedOrder.customerName}</strong></p>
              <p><span className="text-muted-foreground">Phone:</span> <strong>{placedOrder.customerPhone}</strong></p>
              {placedOrder.customerEmail && (
                <p><span className="text-muted-foreground">Email:</span> <strong>{placedOrder.customerEmail}</strong></p>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-foreground text-sm flex items-center gap-1.5 text-primary">
                <MapPin className="w-4 h-4" />
                <span>Delivery Address:</span>
              </div>
              <p><span className="text-muted-foreground">Location:</span> <strong>{placedOrder.district}, {placedOrder.area}</strong></p>
              <p><span className="text-muted-foreground">Address:</span> <strong>{placedOrder.address}</strong></p>
            </div>
          </div>

          {/* Ordered Items Summary */}
          <div className="text-left space-y-3">
            <h4 className="font-bold text-sm text-foreground">Order Items:</h4>
            <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-card">
              {placedOrder.itemsSummary?.map((item: any) => (
                <div key={item.id} className="p-3.5 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      className="w-12 h-12 object-contain bg-muted/30 rounded p-1 border border-border/50 shrink-0"
                    />
                    <div>
                      <div className="font-bold text-foreground line-clamp-1">{item.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatBdt(item.cashPriceBdt)} × {item.quantity}
                      </div>
                    </div>
                  </div>
                  <div className="font-bold text-primary text-sm whitespace-nowrap">
                    {formatBdt(item.cashPriceBdt * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Payable Summary */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2 text-xs text-left">
            <div className="flex justify-between text-muted-foreground">
              <span>Item Subtotal:</span>
              <span className="font-semibold text-foreground">{formatBdt(placedOrder.totalPayableBdt || 0)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery Charge:</span>
              <span className="font-semibold text-foreground">৳{placedOrder.deliveryFee || 70}</span>
            </div>
            <div className="pt-2 border-t border-primary/20 flex justify-between items-baseline">
              <span className="font-black text-sm text-foreground">
                {isOrderBkash ? "Total Paid (bKash):" : "Total Payable on Delivery:"}
              </span>
              <span className="text-xl font-black text-primary">
                {formatBdt((placedOrder.totalPayableBdt || 0) + (placedOrder.deliveryFee || 70))}
              </span>
            </div>
            {isOrderBkash && (
              <div className="flex justify-between items-center text-emerald-600 font-bold pt-1">
                <span>Amount Due:</span>
                <span>৳0 (Fully Paid)</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/products"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto bg-muted text-foreground border border-border hover:bg-muted/80 font-bold px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY CART SCREEN
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-4 max-w-md">
        <div className="w-16 h-16 bg-muted/60 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
          <ShoppingCart className="w-8 h-8 stroke-1 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-foreground">Your Shopping Cart is Empty</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Looks like you haven&apos;t added any products to your cart yet. Explore our high-performance hardware catalog or build your custom PC.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/products"
            className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-primary/20 transition-all"
          >
            Browse Products
          </Link>
          <Link
            href="/pc-builder"
            className="bg-muted text-foreground border border-border font-bold px-6 py-2.5 rounded-xl text-xs hover:bg-muted/80 flex items-center gap-1.5 transition-all"
          >
            <Cpu className="w-4 h-4 text-primary" />
            <span>PC Builder</span>
          </Link>
        </div>
      </div>
    );
  }

  // STANDARD ONE-PAGE CHECKOUT LAYOUT
  // Side 1: Customer Details + Delivery + Payment (Left: 7 cols)
  // Side 2: Selected Products + Order Summary (Right: 5 cols)
  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-primary" />
            <span>Checkout</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Complete your order quickly. No account registration required.
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5 transition-colors py-1.5 px-2.5 rounded-lg border border-border hover:border-destructive/30"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SIDE 1 (LEFT 7 COLS): CUSTOMER INFO, DELIVERY & PAYMENT METHOD */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Customer & Delivery Information */}
          <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 space-y-5 shadow-sm text-left">
            <div className="pb-3 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>1. Delivery & Customer Details</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enter your delivery address and contact information
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Guest Checkout
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span>Full Name <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Sayad Khan"
                  className="w-full bg-background border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none transition-colors"
                />
              </div>

              {/* Mobile Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span>Mobile Phone <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 01712345678"
                  className="w-full bg-background border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none transition-colors"
                />
                <div className="text-[10px] text-muted-foreground">
                  Required for delivery call and verification.
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span>Email Address</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">Optional (for invoice & digital receipt)</span>
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="e.g. yourname@example.com"
                className="w-full bg-background border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none transition-colors"
              />
            </div>

            {/* Delivery Destination Options */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-primary" />
                <span>Delivery Zone <span className="text-rose-500">*</span></span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div
                  onClick={() => handleZoneChange("INSIDE_DHAKA")}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                    deliveryZone === "INSIDE_DHAKA"
                      ? "border-primary bg-primary/5 font-bold shadow-sm"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div>
                    <div className="text-foreground">Inside Dhaka City</div>
                    <div className="text-[10px] text-muted-foreground">Standard Home Delivery: 24-48 hrs</div>
                  </div>
                  <div className="text-primary font-black text-sm">৳70</div>
                </div>

                <div
                  onClick={() => handleZoneChange("OUTSIDE_DHAKA")}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                    deliveryZone === "OUTSIDE_DHAKA"
                      ? "border-primary bg-primary/5 font-bold shadow-sm"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div>
                    <div className="text-foreground">Outside Dhaka (All Districts)</div>
                    <div className="text-[10px] text-muted-foreground">Courier Delivery: 48-72 hrs</div>
                  </div>
                  <div className="text-primary font-black text-sm">৳140</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* District */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-primary" />
                  <span>District <span className="text-rose-500">*</span></span>
                </label>
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none transition-colors"
                >
                  {BD_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Area / Thana */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>Area / Thana <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Dhanmondi / Gulshan / Mirpur"
                  className="w-full bg-background border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none transition-colors"
                />
              </div>
            </div>

            {/* Street Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Detailed Delivery Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House #, Road #, Sector / Block details"
                className="w-full bg-background border border-border focus:border-primary rounded-xl px-3.5 py-2 text-xs text-foreground outline-none transition-colors resize-none"
              />
            </div>

            {/* Order Notes (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Special Delivery Instructions (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Deliver after 4:00 PM"
                className="w-full bg-background border border-border focus:border-primary rounded-xl px-3.5 py-2 text-xs text-foreground outline-none transition-colors"
              />
            </div>
          </div>

          {/* Section 2: Payment Method */}
          <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 space-y-4 text-left shadow-sm">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2 pb-3 border-b border-border">
              <Banknote className="w-4 h-4 text-primary" />
              <span>2. Payment Method</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Cash on Delivery */}
              <div
                onClick={() => {
                  setPaymentMethod("COD");
                  setBkashTrxId(null);
                }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === "COD"
                    ? "border-emerald-500 bg-emerald-500/5 shadow-sm"
                    : "border-border hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-full border-4 flex items-center justify-center ${
                        paymentMethod === "COD"
                          ? "border-emerald-500 bg-white"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    />
                    <span className="font-bold text-sm text-foreground">
                      Cash on Delivery (COD)
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
                  Pay with cash after receiving and inspecting your parcel.
                </p>
              </div>

              {/* Option 2: bKash Payment */}
              <div
                onClick={() => setPaymentMethod("BKASH")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden ${
                  paymentMethod === "BKASH"
                    ? "border-[#E2136E] bg-pink-500/5 shadow-md shadow-pink-500/10"
                    : "border-border hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-full border-4 flex items-center justify-center ${
                        paymentMethod === "BKASH"
                          ? "border-[#E2136E] bg-white"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    />
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm text-foreground">bKash Payment</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#E2136E] text-white tracking-wide">
                        bKash
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
                  Fast cashless payment via bKash gateway or merchant number.
                </p>
              </div>
            </div>

            {/* bKash Details Card */}
            {paymentMethod === "BKASH" && (
              <div className="p-4 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800/40 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-[#E2136E] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>bKash Official Merchant Payment</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Make direct online payment from your personal bKash account.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!validateForm()) return;
                      setIsBkashModalOpen(true);
                    }}
                    className="bg-[#E2136E] hover:bg-[#c20f5d] text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-pink-500/25 transition-all whitespace-nowrap"
                  >
                    <span>{bkashTrxId ? "Change Payment" : "Pay with bKash"}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {bkashTrxId ? (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Payment Verified! Transaction ID: {bkashTrxId}</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/40 p-2.5 rounded-lg border border-pink-100 dark:border-pink-900/50">
                    💡 Clicking &quot;Place Order&quot; below will also launch the secure bKash checkout popup.
                  </div>
                )}
              </div>
            )}

            {/* Outside Dhaka Rule 4.5 Deposit Notice */}
            {paymentMethod === "COD" && depositCheck.requiresDeposit && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-xs text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Outside-Dhaka Delivery Policy:</div>
                  <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
                    {depositCheck.reason}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SIDE 2 (RIGHT 5 COLS): SELECTED PRODUCTS & ORDER SUMMARY */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* Selected Products List */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm text-left">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                <span>Selected Products ({items.length})</span>
              </h3>
              <span className="text-xs font-semibold text-primary">Cash Price</span>
            </div>

            <div className="divide-y divide-border/60 max-h-[380px] overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 bg-muted/30 rounded-xl p-1.5 shrink-0 border border-border/50 flex items-center justify-center">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase">
                        SKU: {item.sku}
                      </div>
                      <h4 className="font-bold text-xs text-foreground truncate max-w-[190px]">
                        {item.name}
                      </h4>
                      <div className="text-xs font-bold text-primary">
                        {formatBdt(item.cashPriceBdt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-border rounded-lg bg-muted/20 p-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted font-bold text-xs"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary Card */}
          <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 space-y-5 shadow-sm text-left">
            <h3 className="font-black text-base text-foreground pb-3 border-b border-border">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Items Subtotal</span>
                <span className="font-bold text-foreground">{formatBdt(cashSubtotal)}</span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>
                  Delivery Charge ({deliveryZone === "INSIDE_DHAKA" ? "Inside Dhaka" : "Outside Dhaka"})
                </span>
                <span className="font-bold text-foreground">৳{deliveryFee}</span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Payment Mode</span>
                <span className="font-bold text-foreground">
                  {paymentMethod === "BKASH" ? "bKash Online" : "Cash on Delivery"}
                </span>
              </div>

              {paymentMethod === "COD" && depositCheck.requiresDeposit && (
                <div className="flex justify-between text-amber-500 font-semibold bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                  <span>Advance Deposit via bKash</span>
                  <span>৳{depositCheck.depositAmountBdt}</span>
                </div>
              )}

              <div className="pt-3 border-t border-border flex justify-between items-baseline">
                <div>
                  <span className="font-extrabold text-sm text-foreground block">
                    Total Payable
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {paymentMethod === "BKASH" ? "Instant bKash Payment" : "Due on Delivery"}
                  </span>
                </div>
                <span className="text-2xl font-black text-primary">{formatBdt(grandTotal)}</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Place Order CTA Button */}
            <button
              id="confirm-order-btn"
              type="submit"
              disabled={isSubmitting}
              className={`w-full text-white font-black py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-xl transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-60 ${
                paymentMethod === "BKASH"
                  ? "bg-[#E2136E] hover:bg-[#c20f5d] shadow-pink-600/25"
                  : "bg-[#1340b8] hover:bg-blue-800 shadow-blue-600/20"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Order...</span>
                </>
              ) : paymentMethod === "BKASH" && !bkashTrxId ? (
                <>
                  <span>Pay with bKash ({formatBdt(grandTotal)})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Banknote className="w-4 h-4" />
                  <span>Confirm Order</span>
                </>
              )}
            </button>

            {/* Trust Badges */}
            <div className="space-y-2 pt-3 border-t border-border/80 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>100% Genuine Products with Official Warranty</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Fast 24-48 Hours Express Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Secure Cash on Delivery & bKash Gateway</span>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* bKash Payment Modal */}
      <BkashModal
        isOpen={isBkashModalOpen}
        onClose={() => setIsBkashModalOpen(false)}
        amount={grandTotal}
        invoiceNo={`SOL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`}
        customerPhone={customerPhone}
        onPaymentSuccess={handleBkashPaymentSuccess}
      />
    </div>
  );
}
