"use client";

import React from "react";

interface ProductCardSkeletonProps {
  viewMode?: "grid" | "list";
}

export function ProductCardSkeleton({ viewMode = "grid" }: ProductCardSkeletonProps) {
  if (viewMode === "list") {
    return (
      <div className="bg-white dark:bg-[#0d1620] rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row items-center gap-5 animate-pulse">
        {/* Thumbnail shimmer */}
        <div className="w-full md:w-48 h-40 shrink-0 bg-slate-200 dark:bg-slate-800/80 rounded-lg relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent" />
        </div>

        {/* Info */}
        <div className="flex-1 space-y-3 text-left w-full">
          <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-5 w-4/5 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="space-y-1.5 pt-2">
            <div className="h-3 w-3/5 bg-slate-100 dark:bg-slate-800/60 rounded" />
            <div className="h-3 w-2/5 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
          <div className="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded pt-1" />
        </div>

        {/* Pricing & CTA */}
        <div className="w-full md:w-48 shrink-0 flex flex-col justify-between border-t md:border-t-0 md:border-l border-border md:pl-5 pt-3 md:pt-0 space-y-3">
          <div className="space-y-1">
            <div className="h-6 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
          <div className="h-9 w-full bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0d1620] rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3.5 flex flex-col justify-between relative overflow-hidden animate-pulse">
      {/* Top Tag & Compare icon placeholder */}
      <div className="flex items-center justify-between mb-1">
        <div className="h-3.5 sm:h-4 w-16 sm:w-20 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="hidden sm:block h-4 w-4 rounded bg-slate-100 dark:bg-slate-800/50" />
      </div>

      {/* Product Image Area shimmer */}
      <div className="relative w-full h-32 sm:h-44 bg-slate-100 dark:bg-slate-800/50 rounded-lg overflow-hidden flex items-center justify-center p-2 my-1">
        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-slate-200 dark:bg-slate-700/50" />
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent" />
      </div>

      {/* Title skeleton */}
      <div className="text-left mb-1.5 sm:mb-2 space-y-1 sm:space-y-1.5 h-8 sm:h-11">
        <div className="h-3 sm:h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-3 sm:h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>

      {/* Key features bullets skeleton (Desktop only) */}
      <div className="hidden sm:block space-y-1.5 mb-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
          <div className="h-3 w-4/5 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
          <div className="h-3 w-3/5 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
      </div>

      {/* Pricing block skeleton */}
      <div className="pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-baseline gap-2">
          <div className="h-4 sm:h-6 w-20 sm:w-24 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-12 sm:w-14 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>

        {/* Buy Now button skeleton (Desktop only) */}
        <div className="hidden sm:block w-full h-10 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
