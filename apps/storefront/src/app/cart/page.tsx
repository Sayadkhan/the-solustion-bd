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
} from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { formatBdt, calculateAdvanceDepositRequirement } from "@solusation/shared-types";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotalCashBdt, getTotalRegularBdt } =
    useCartStore();

  const [deliveryZone, setDeliveryZone] = useState<"INSIDE_DHAKA" | "OUTSIDE_DHAKA">(
    "INSIDE_DHAKA"
  );
  const [district, setDistrict] = useState<string>("Dhaka");
  const [paymentMethod, setPaymentMethod] = useState<string>("COD");

  const cashSubtotal = getTotalCashBdt();
  const regularSubtotal = getTotalRegularBdt();
  const deliveryFee = deliveryZone === "INSIDE_DHAKA" ? 70 : 140;
  const grandTotal = cashSubtotal + deliveryFee;

  // Rule 4.5 Outside Dhaka deposit check
  const depositCheck = calculateAdvanceDepositRequirement({
    district: deliveryZone === "OUTSIDE_DHAKA" ? "Chattogram" : "Dhaka",
    totalBdt: grandTotal,
    paymentMethod,
  });

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
          <ShoppingCart className="w-8 h-8 stroke-1" />
        </div>
        <h2 className="text-2xl font-black text-foreground">Your Cart is Empty</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          You haven&apos;t added any PC components yet. Browse our hardware catalog or build your custom PC simulator.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/products"
            className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-xs hover:bg-primary/90 shadow-md shadow-primary/20"
          >
            Browse Products
          </Link>
          <Link
            href="/pc-builder"
            className="bg-muted text-foreground border border-border font-bold px-6 py-2.5 rounded-xl text-xs hover:bg-muted/80 flex items-center gap-1.5"
          >
            <Cpu className="w-4 h-4 text-primary" />
            <span>PC Builder</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
          <ShoppingCart className="w-7 h-7 text-primary" />
          <span>Shopping Cart ({items.length} items)</span>
        </h1>
        <button
          onClick={clearCart}
          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-card rounded-2xl border border-border/80 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 justify-between"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-20 h-20 bg-muted/30 rounded-xl p-2 shrink-0 border border-border/50 flex items-center justify-center">
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
                  <h3 className="font-bold text-sm text-foreground line-clamp-2">
                    {item.name}
                  </h3>
                  <div className="text-xs font-bold text-primary">
                    {formatBdt(item.cashPriceBdt)}{" "}
                    <span className="text-[10px] font-normal text-muted-foreground">Cash Discount</span>
                  </div>
                </div>
              </div>

              {/* Quantity & Controls */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
                <div className="flex items-center border border-border rounded-lg bg-muted/20 p-0.5">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted font-bold text-xs"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-foreground">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted font-bold text-xs"
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <div className="text-sm font-extrabold text-foreground">
                    {formatBdt(item.cashPriceBdt * item.quantity)}
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-muted-foreground hover:text-destructive p-1.5 transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Delivery Zone Selection */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              <span>Shipping Destination</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label
                onClick={() => setDeliveryZone("INSIDE_DHAKA")}
                className={`p-3.5 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                  deliveryZone === "INSIDE_DHAKA"
                    ? "border-primary bg-primary/5 font-bold"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <div>
                  <div className="text-foreground">Inside Dhaka City</div>
                  <div className="text-[10px] text-muted-foreground">Standard Delivery: 24-48h</div>
                </div>
                <div className="text-primary font-bold">৳70</div>
              </label>

              <label
                onClick={() => setDeliveryZone("OUTSIDE_DHAKA")}
                className={`p-3.5 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                  deliveryZone === "OUTSIDE_DHAKA"
                    ? "border-primary bg-primary/5 font-bold"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <div>
                  <div className="text-foreground">Outside Dhaka (All BD Districts)</div>
                  <div className="text-[10px] text-muted-foreground">Pathao / Steadfast: 48-72h</div>
                </div>
                <div className="text-primary font-bold">৳140</div>
              </label>
            </div>

            {/* Rule 4.5 Alert Banner */}
            {depositCheck.requiresDeposit && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-xs text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Outside-Dhaka Delivery Policy (Rule 4.5):</div>
                  <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
                    {depositCheck.reason}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-card rounded-2xl border border-border p-6 space-y-5 sticky top-24 shadow-md">
          <h3 className="font-black text-lg text-foreground pb-3 border-b border-border">
            Order Summary
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Cash Subtotal</span>
              <span className="font-bold text-foreground">{formatBdt(cashSubtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Estimated Delivery Fee</span>
              <span className="font-bold text-foreground">৳{deliveryFee}</span>
            </div>
            {depositCheck.requiresDeposit && (
              <div className="flex justify-between text-amber-500 font-semibold bg-amber-500/10 p-2 rounded border border-amber-500/20">
                <span>Advance Deposit via bKash</span>
                <span>৳{depositCheck.depositAmountBdt}</span>
              </div>
            )}
            <div className="pt-3 border-t border-border flex justify-between items-baseline">
              <span className="font-extrabold text-sm text-foreground">Total Payable</span>
              <span className="text-xl font-black text-primary">{formatBdt(grandTotal)}</span>
            </div>
          </div>

          <button
            onClick={() => alert("Checkout Flow: You can complete this order via Cash on Delivery, bKash, or SSLCommerz card!")}
            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="space-y-2 pt-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Official Manufacturer Warranty Included</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Free Delivery in Dhaka on orders above ৳50,000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
