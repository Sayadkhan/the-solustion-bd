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
  Check,
  ExternalLink,
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

  // Guest checkout customer info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [district, setDistrict] = useState("Dhaka");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryZone, setDeliveryZone] = useState<"INSIDE_DHAKA" | "OUTSIDE_DHAKA">("INSIDE_DHAKA");

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BKASH">("COD");
  const [bkashTrxId, setBkashTrxId] = useState<string | null>(null);
  const [isBkashModalOpen, setIsBkashModalOpen] = useState(false);

  // Order submission state
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

  // Rule 4.5 Outside Dhaka deposit check
  const depositCheck = calculateAdvanceDepositRequirement({
    district: deliveryZone === "OUTSIDE_DHAKA" ? district : "Dhaka",
    totalBdt: grandTotal,
    paymentMethod: paymentMethod === "BKASH" ? "BKASH" : "COD",
  });

  // Common customer validation
  const validateForm = () => {
    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage("অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন (Please enter your full name).");
      return false;
    }

    const cleanPhone = customerPhone.trim().replace(/[\s-]/g, "");
    if (!isValidBdPhone(cleanPhone)) {
      setErrorMessage(
        "অনুগ্রহ করে একটি সঠিক বাংলাদেশী মোবাইল নম্বর লিখুন (e.g. 01712345678)."
      );
      return false;
    }

    if (!area.trim() || area.trim().length < 2) {
      setErrorMessage("অনুগ্রহ করে আপনার থানা বা এলাকা লিখুন (Please enter your area/thana).");
      return false;
    }

    if (!address.trim() || address.trim().length < 5) {
      setErrorMessage(
        "অনুগ্রহ করে পূর্ণ ডেলিভারি ঠিকানা লিখুন যেমন বাসা/রোড নম্বর (Please enter detailed delivery address)."
      );
      return false;
    }

    if (items.length === 0) {
      setErrorMessage("আপনার কার্টে কোনো প্রোডাক্ট নেই (Your cart is empty).");
      return false;
    }

    return true;
  };

  // Callback when bKash payment succeeds inside the modal
  const handleBkashPaymentSuccess = async (trxId: string, paymentDetails: any) => {
    setBkashTrxId(trxId);
    setIsBkashModalOpen(false);

    // Place the order immediately with bKash TrxID
    await executeOrderPlacement(trxId);
  };

  // Execute Order Placement to backend API
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
        customerEmail: null,
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
          itemsSummary: items,
          deliveryFee,
          deliveryZone,
          paymentMethodUsed: isPayingWithBkash ? "BKASH" : "COD",
          trxId: activeTrxId || res.data.trxId,
        });
        clearCart();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setErrorMessage(res?.message || "অর্ডার সম্পন্ন হতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "অর্ডার প্লেস করার সময় সমস্যা হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form submit handler
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) return;

    // If bKash is selected but TrxID is not yet verified, open the bKash Gateway Modal
    if (paymentMethod === "BKASH" && !bkashTrxId) {
      setIsBkashModalOpen(true);
      return;
    }

    await executeOrderPlacement();
  };

  // SUCCESS SCREEN: When order is placed successfully
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
              Order Placed Successfully
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              {isOrderBkash
                ? "বিকাশ পেমেন্ট সফলভাবে ভেরিফাই হয়েছে। আপনার অর্ডার কনফার্ম করে দ্রুত প্যাকেজিং শুরু করা হয়েছে।"
                : "ধন্যবাদ! আমাদের কাস্টমার সাপোর্ট টিম শীঘ্রই আপনার মোবাইল নম্বরে ফোন করে অর্ডারটি কনফার্ম করবেন।"}
            </p>
          </div>

          {/* Invoice & Status Header Box */}
          <div className="bg-muted/40 rounded-xl p-4 border border-border flex flex-wrap items-center justify-between gap-4 text-left">
            <div>
              <div className="text-xs text-muted-foreground">ইনভয়েস নম্বর (Invoice No):</div>
              <div className="text-base font-black text-primary tracking-wide">
                #{placedOrder.invoiceNo}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">পেমেন্ট মেথড:</div>
              {isOrderBkash ? (
                <div className="text-sm font-bold text-[#E2136E] flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-[#E2136E] text-white rounded-full flex items-center justify-center text-[10px] font-black">
                    ৳
                  </div>
                  <span>বিকাশ পেমেন্ট (PAID)</span>
                </div>
              ) : (
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4" />
                  <span>ক্যাশ অন ডেলিভারি (COD)</span>
                </div>
              )}
            </div>

            <div>
              <div className="text-xs text-muted-foreground">অর্ডার স্ট্যাটাস:</div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded border ${
                  isOrderBkash
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                }`}
              >
                {isOrderBkash ? "CONFIRMED" : placedOrder.orderStatus || "PENDING"}
              </span>
            </div>
          </div>

          {/* If bKash, display verified TrxID banner */}
          {isOrderBkash && placedOrder.trxId && (
            <div className="p-3 bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800/50 rounded-xl flex items-center justify-between text-xs text-left">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#E2136E]" />
                <span className="text-slate-700 dark:text-slate-300">
                  বিকাশ ট্রানজেকশন আইডি (TrxID):
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
                <span>গ্রাহকের বিবরণ:</span>
              </div>
              <p><span className="text-muted-foreground">নাম:</span> <strong>{placedOrder.customerName}</strong></p>
              <p><span className="text-muted-foreground">ফোন:</span> <strong>{placedOrder.customerPhone}</strong></p>
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-foreground text-sm flex items-center gap-1.5 text-primary">
                <MapPin className="w-4 h-4" />
                <span>ডেলিভারি ঠিকানা:</span>
              </div>
              <p><span className="text-muted-foreground">জেলা / এরিয়া:</span> <strong>{placedOrder.district}, {placedOrder.area}</strong></p>
              <p><span className="text-muted-foreground">ঠিকানা:</span> <strong>{placedOrder.address}</strong></p>
            </div>
          </div>

          {/* Ordered Items Summary */}
          <div className="text-left space-y-3">
            <h4 className="font-bold text-sm text-foreground">অর্ডারকৃত প্রোডাক্টসমূহ:</h4>
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
              <span>প্রোডাক্ট সাবটোটাল:</span>
              <span className="font-semibold text-foreground">{formatBdt(placedOrder.totalPayableBdt || 0)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>ডেলিভারি চার্জ:</span>
              <span className="font-semibold text-foreground">৳{placedOrder.deliveryFee || 70}</span>
            </div>
            <div className="pt-2 border-t border-primary/20 flex justify-between items-baseline">
              <span className="font-black text-sm text-foreground">
                {isOrderBkash ? "পরিশোধিত সর্বমোট (বিকাশ):" : "পণ্য হাতে পেয়ে সর্বমোট প্রদেয়:"}
              </span>
              <span className="text-xl font-black text-primary">
                {formatBdt((placedOrder.totalPayableBdt || 0) + (placedOrder.deliveryFee || 70))}
              </span>
            </div>
            {isOrderBkash && (
              <div className="flex justify-between items-center text-emerald-600 font-bold pt-1">
                <span>বকেয়া মূল্য:</span>
                <span>৳০ (সম্পূর্ণ পরিশোধিত)</span>
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
              <span>আরও কেনাকাটা করুন (Continue Shopping)</span>
            </Link>
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto bg-muted text-foreground border border-border hover:bg-muted/80 font-bold px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>রসিদ প্রিন্ট করুন (Print Invoice)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY CART SCREEN
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
          <ShoppingCart className="w-8 h-8 stroke-1" />
        </div>
        <h2 className="text-2xl font-black text-foreground">আপনার শপিং কার্ট খালি (Your Cart is Empty)</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          আপনার কার্টে বর্তমানে কোনো প্রোডাক্ট যোগ করা নেই। আমাদের প্রোডাক্ট ক্যাটালগ থেকে আপনার পছন্দের আইটেম বেছে নিন।
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/products"
            className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-xs hover:bg-primary/90 shadow-md shadow-primary/20"
          >
            প্রোডাক্ট দেখুন (Browse Products)
          </Link>
          <Link
            href="/pc-builder"
            className="bg-muted text-foreground border border-border font-bold px-6 py-2.5 rounded-xl text-xs hover:bg-muted/80 flex items-center gap-1.5"
          >
            <Cpu className="w-4 h-4 text-primary" />
            <span>পিসি বিল্ডার (PC Builder)</span>
          </Link>
        </div>
      </div>
    );
  }

  // CART & GUEST CHECKOUT SCREEN
  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-primary" />
            <span>শপিং কার্ট ও চেকআউট</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            লগইন ছাড়াই সহজে বিকাশ বা ক্যাশ অন ডেলিভারিতে অর্ডার করুন।
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>কার্ট খালি করুন</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Cart Items + Guest Details (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Cart Items List */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-base text-foreground flex items-center justify-between pb-3 border-b border-border">
              <span>সিলেক্ট করা প্রোডাক্টসমূহ ({items.length})</span>
              <span className="text-xs font-normal text-muted-foreground">ক্যাশ ডিসকাউন্ট মূল্য</span>
            </h3>

            <div className="divide-y divide-border/60">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row items-center gap-4 justify-between"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-16 h-16 bg-muted/30 rounded-xl p-2 shrink-0 border border-border/50 flex items-center justify-center">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase">
                        SKU: {item.sku}
                      </div>
                      <h4 className="font-bold text-sm text-foreground line-clamp-1">
                        {item.name}
                      </h4>
                      <div className="text-xs font-bold text-primary">
                        {formatBdt(item.cashPriceBdt)}
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Delete */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
                    <div className="flex items-center border border-border rounded-lg bg-muted/20 p-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted font-bold text-xs"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <div className="text-sm font-extrabold text-foreground">
                        {formatBdt(item.cashPriceBdt * item.quantity)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive p-1.5 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guest Checkout Information Form */}
          <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 space-y-5 shadow-sm text-left">
            <div className="pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span>ডেলিভারি ও কাস্টমার তথ্য (লগইন প্রয়োজন নেই)</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                অর্ডার পৌঁছানোর জন্য আপনার সঠিক তথ্য প্রদান করুন।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span>আপনার পূর্ণ নাম <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="যেমন: সায়াদ খান"
                  className="w-full bg-background border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none transition-colors"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span>মোবাইল নম্বর <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="যেমন: 01712345678"
                  className="w-full bg-background border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none transition-colors"
                />
                <div className="text-[10px] text-muted-foreground">
                  ডেলিভারির জন্য এই নম্বরে কল করে কনফার্ম করা হবে।
                </div>
              </div>
            </div>

            {/* Delivery Destination Options */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-primary" />
                <span>ডেলিভারি এলাকা নির্বাচন করুন <span className="text-rose-500">*</span></span>
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
                    <div className="text-foreground">ঢাকার ভিতরে (Inside Dhaka)</div>
                    <div className="text-[10px] text-muted-foreground">হোম ডেলিভারি: ২৪-৪৮ ঘণ্টা</div>
                  </div>
                  <div className="text-primary font-black text-sm">৳৭০</div>
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
                    <div className="text-foreground">ঢাকার বাইরে (Outside Dhaka)</div>
                    <div className="text-[10px] text-muted-foreground">পাঠাও / স্টিডফাস্ট কুরিয়ার: ৪৮-৭২ ঘণ্টা</div>
                  </div>
                  <div className="text-primary font-black text-sm">৳১৪০</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* District */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-primary" />
                  <span>জেলা (District) <span className="text-rose-500">*</span></span>
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
                  <span>থানা / এরিয়া (Area/Thana) <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="যেমন: মিরপুর / ধানমন্ডি / উত্তরা"
                  className="w-full bg-background border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none transition-colors"
                />
              </div>
            </div>

            {/* Street Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                পূর্ণ ডেলিভারি ঠিকানা (বাসা/রোড/ব্লক) <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="যেমন: বাড়ি #১২, রোড #০৪, সেক্টর #০৭"
                className="w-full bg-background border border-border focus:border-primary rounded-xl px-3.5 py-2 text-xs text-foreground outline-none transition-colors resize-none"
              />
            </div>

            {/* Order Notes (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                বিশেষ কোনো নির্দেশনা (ঐচ্ছিক / Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="যেমন: বিকেল ৫টার পর ডেলিভারি দিলে ভালো হয়"
                className="w-full bg-background border border-border focus:border-primary rounded-xl px-3.5 py-2 text-xs text-foreground outline-none transition-colors"
              />
            </div>
          </div>

          {/* Payment Method Selection: COD vs bKash Payment Gateway */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 text-left shadow-sm">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2 pb-3 border-b border-border">
              <Banknote className="w-5 h-5 text-primary" />
              <span>পেমেন্ট পদ্ধতি নির্বাচন করুন (Payment Method)</span>
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
                      ক্যাশ অন ডেলিভারি (COD)
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
                  পণ্য হাতে পেয়ে দেখে ডেলিভারি ম্যানের কাছে মূল্য পরিশোধ করুন।
                </p>
              </div>

              {/* Option 2: bKash Payment Gateway */}
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
                      <span className="font-black text-sm text-foreground">বিকাশ পেমেন্ট</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#E2136E] text-white tracking-wide">
                        bKash
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
                  বিকাশ অনলাইন গেটওয়ে অথবা মার্চেন্ট পে দিয়ে ইনস্ট্যান্ট ক্যাশলেস পেমেন্ট।
                </p>
              </div>
            </div>

            {/* bKash Details & Gateway Trigger Card */}
            {paymentMethod === "BKASH" && (
              <div className="p-4 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800/40 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-[#E2136E] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>bKash Official Merchant Payment</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      অফিসিয়াল গেটওয়ের মাধ্যমে আপনার বিকাশ অ্যাকাউন্ট থেকে সরাসরি পেমেন্ট করুন।
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
                    <span>{bkashTrxId ? "পেমেন্ট পরিবর্তন করুন" : "বিকাশ দিয়ে পে করুন"}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* If already verified TrxID */}
                {bkashTrxId ? (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>বিকাশ পেমেন্ট কনফার্ম হয়েছে! TrxID: {bkashTrxId}</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/40 p-2.5 rounded-lg border border-pink-100 dark:border-pink-900/50">
                    💡 আপনি &quot;অর্ডার নিশ্চিত করুন&quot; বাটনে ক্লিক করলেও সরাসরি বিকাশ পেমেন্ট পপ-আপ ওপেন হবে।
                  </div>
                )}
              </div>
            )}

            {/* Rule 4.5 Alert if Outside Dhaka & High Value for COD */}
            {paymentMethod === "COD" && depositCheck.requiresDeposit && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-xs text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">ঢাকার বাইরের ডেলিভারি পলিসি (Rule 4.5):</div>
                  <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
                    {depositCheck.reason}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Order Summary & Place Order Button (4 cols) */}
        <div className="lg:col-span-4 bg-card rounded-2xl border border-border p-6 space-y-5 sticky top-24 shadow-md text-left">
          <h3 className="font-black text-lg text-foreground pb-3 border-b border-border">
            অর্ডার সামারি (Order Summary)
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>প্রোডাক্ট সাবটোটাল ({items.length}টি)</span>
              <span className="font-bold text-foreground">{formatBdt(cashSubtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>
                ডেলিভারি চার্জ ({deliveryZone === "INSIDE_DHAKA" ? "ঢাকা সিটি" : "ঢাকার বাইরে"})
              </span>
              <span className="font-bold text-foreground">৳{deliveryFee}</span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>নির্বাচিত পেমেন্ট মেথড:</span>
              <span className="font-bold text-foreground">
                {paymentMethod === "BKASH" ? "বিকাশ পেমেন্ট (bKash)" : "ক্যাশ অন ডেলিভারি (COD)"}
              </span>
            </div>

            {paymentMethod === "COD" && depositCheck.requiresDeposit && (
              <div className="flex justify-between text-amber-500 font-semibold bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                <span>অগ্রিম বুকিং ডিপোজিট</span>
                <span>৳{depositCheck.depositAmountBdt}</span>
              </div>
            )}

            <div className="pt-3 border-t border-border flex justify-between items-baseline">
              <div>
                <span className="font-extrabold text-sm text-foreground block">
                  সর্বমোট প্রদেয় টাকা
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {paymentMethod === "BKASH" ? "বিকাশ ইনস্ট্যান্ট পেমেন্ট" : "ক্যাশ অন ডেলিভারি"}
                </span>
              </div>
              <span className="text-2xl font-black text-primary">{formatBdt(grandTotal)}</span>
            </div>
          </div>

          {/* Place Order CTA Button */}
          <button
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
                <span>অর্ডার প্রসেস হচ্ছে...</span>
              </>
            ) : paymentMethod === "BKASH" && !bkashTrxId ? (
              <>
                <span>বিকাশ দিয়ে পে করুন ({formatBdt(grandTotal)})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Banknote className="w-4 h-4" />
                <span>অর্ডার নিশ্চিত করুন (Confirm Order)</span>
              </>
            )}
          </button>

          {/* Trust Badges */}
          <div className="space-y-2.5 pt-3 border-t border-border/80 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>১০০% অফিসিয়াল ওয়ারেন্টিযুক্ত প্রোডাক্ট</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500 shrink-0" />
              <span>২৪-৪৮ ঘণ্টার মধ্যে দ্রুত হোম ডেলিভারি</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>নিরাপদ বিকাশ পেমেন্ট ও ক্যাশ অন ডেলিভারি</span>
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
