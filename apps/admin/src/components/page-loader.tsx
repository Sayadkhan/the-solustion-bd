"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export function PageLoader({ title = "Loading page..." }: { title?: string }) {
  return (
    <div className="min-h-[500px] w-full flex flex-col justify-start space-y-6 animate-in fade-in duration-200">
      {/* Top indeterminate streaming progress line */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted/40 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary/50 via-primary to-emerald-500 w-1/2 animate-indeterminate rounded-full shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
      </div>

      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-muted/70 rounded animate-pulse" />
          <div className="h-7 w-64 bg-muted/90 rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-muted/80 rounded-lg animate-pulse" />
          <div className="h-9 w-36 bg-primary/20 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Info Card Banner Skeleton */}
      <div className="p-4 rounded-xl border border-border/60 bg-card/60 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted/80 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-4 w-72 bg-muted/80 rounded animate-pulse" />
            <div className="h-3 w-96 bg-muted/50 rounded animate-pulse hidden sm:block" />
          </div>
        </div>
        <div className="h-6 w-24 bg-muted/60 rounded-full animate-pulse" />
      </div>

      {/* Filters Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="h-9 w-full max-w-md bg-card/80 border border-border/60 rounded-xl animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-32 bg-card/80 border border-border/60 rounded-xl animate-pulse" />
          <div className="h-9 w-32 bg-card/80 border border-border/60 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-card border border-border/70 rounded-xl shadow-sm overflow-hidden">
        {/* Table Head */}
        <div className="bg-muted/30 border-b border-border px-5 py-3.5 flex items-center justify-between">
          <div className="h-4 w-8 bg-muted/80 rounded animate-pulse" />
          <div className="h-4 w-40 bg-muted/80 rounded animate-pulse" />
          <div className="h-4 w-28 bg-muted/80 rounded animate-pulse" />
          <div className="h-4 w-24 bg-muted/80 rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted/80 rounded animate-pulse" />
        </div>

        {/* Table Rows Skeleton */}
        <div className="divide-y divide-border/40">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors"
            >
              <div className="w-6 h-4 bg-muted/60 rounded animate-pulse font-mono text-xs" />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 rounded-lg bg-muted/70 shrink-0 animate-pulse" />
                <div className="space-y-1.5 flex-1 max-w-sm">
                  <div className="h-4 w-3/4 bg-muted/80 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-muted/50 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-5 w-24 bg-muted/60 rounded animate-pulse hidden md:block" />
              <div className="h-5 w-20 bg-muted/60 rounded animate-pulse" />
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-7 h-7 rounded bg-muted/60 animate-pulse" />
                <div className="w-7 h-7 rounded bg-muted/60 animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Loading Indicator */}
        <div className="py-4 border-t border-border/50 bg-muted/10 flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          <span>{title}</span>
        </div>
      </div>
    </div>
  );
}
