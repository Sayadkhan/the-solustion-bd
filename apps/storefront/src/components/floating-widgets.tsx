"use client";

import React from "react";
import Link from "next/link";
import { ShoppingCart, GitCompare, Zap } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useCompareStore } from "@/stores/compare-store";

export function FloatingWidgets() {
  const cartCount = useCartStore((s) => s.getItemCount());
  const compareCount = useCompareStore((s) => s.items.length);

  return (
    <div className="fixed right-3 bottom-6 z-50 flex flex-col items-end gap-2.5">
      {/* 1. Special Campaign / Deals Floating Badge */}
      <Link
        href="/products?deals=true"
        className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 via-rose-600 to-red-600 text-white flex flex-col items-center justify-center shadow-2xl hover:scale-110 transition-transform group border border-white/20"
        title="10.10 Mega Tech Deals"
      >
        <Zap className="w-4 h-4 fill-white animate-bounce" />
        <span className="text-[9px] font-black tracking-tight leading-none">10.10</span>
      </Link>

      {/* 2. Floating Compare Badge */}
      <Link
        href="/compare"
        className="w-14 h-14 rounded-xl bg-[#081621] hover:bg-[#0c2233] text-white border border-slate-700/80 shadow-2xl flex flex-col items-center justify-center relative hover:scale-105 transition-all group"
        title="Compare Products"
      >
        <GitCompare className="w-5 h-5 text-slate-300 group-hover:text-cyan-400 transition-colors" />
        <span className="text-[9px] font-bold tracking-tighter uppercase text-slate-300 mt-0.5">
          COMPARE
        </span>
        <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center shadow">
          {compareCount}
        </span>
      </Link>

      {/* 3. Floating Cart Badge */}
      <Link
        href="/cart"
        className="w-14 h-14 rounded-xl bg-[#081621] hover:bg-[#0c2233] text-white border border-slate-700/80 shadow-2xl flex flex-col items-center justify-center relative hover:scale-105 transition-all group"
        title="View Cart & Checkout"
      >
        <ShoppingCart className="w-5 h-5 text-slate-300 group-hover:text-red-500 transition-colors" />
        <span className="text-[9px] font-bold tracking-tighter uppercase text-slate-300 mt-0.5">
          CART
        </span>
        <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center shadow">
          {cartCount}
        </span>
      </Link>
    </div>
  );
}
