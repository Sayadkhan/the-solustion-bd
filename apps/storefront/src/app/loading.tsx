import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-200">
      {/* Top indeterminate glowing progress line */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted/30 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-red-600/40 via-red-600 to-amber-500 w-1/2 animate-indeterminate rounded-full shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner Skeleton */}
        <div className="w-full h-64 sm:h-80 md:h-96 rounded-2xl bg-muted/60 border border-border/60 animate-pulse relative overflow-hidden flex flex-col justify-end p-8">
          <div className="space-y-3 max-w-lg">
            <div className="h-5 w-32 bg-primary/30 rounded-full animate-pulse" />
            <div className="h-8 sm:h-10 w-full bg-muted/90 rounded-lg animate-pulse" />
            <div className="h-4 w-3/4 bg-muted/70 rounded animate-pulse" />
          </div>
        </div>

        {/* Category Pills Skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="h-9 w-28 shrink-0 rounded-full bg-card border border-border/60 animate-pulse"
            />
          ))}
        </div>

        {/* Product Grid Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-48 bg-muted/80 rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted/60 rounded animate-pulse" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border/60 bg-card p-3 space-y-3 animate-pulse"
              >
                <div className="aspect-square w-full rounded-xl bg-muted/60" />
                <div className="space-y-1.5">
                  <div className="h-3 w-16 bg-muted/50 rounded" />
                  <div className="h-4 w-full bg-muted/80 rounded" />
                  <div className="h-4 w-2/3 bg-muted/70 rounded" />
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-border/40">
                  <div className="h-5 w-20 bg-emerald-500/20 rounded" />
                  <div className="h-8 w-8 bg-muted/80 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Centered loader footer */}
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
          <span>Streaming high-performance components & latest pricing...</span>
        </div>
      </div>
    </div>
  );
}
