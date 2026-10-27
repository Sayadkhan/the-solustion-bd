"use client";

import React from "react";

interface TableRowSkeletonProps {
  rows?: number;
  type?: "orders" | "products" | "generic";
  cols?: number;
}

export function AdminTableRowSkeleton({ rows = 8, type = "generic", cols = 7 }: TableRowSkeletonProps) {
  const rowArray = Array.from({ length: rows });

  if (type === "orders") {
    return (
      <>
        {rowArray.map((_, i) => (
          <tr key={i} className="animate-pulse border-b border-border/40">
            {/* Serial */}
            <td className="px-3 py-4 text-center">
              <div className="h-4 w-5 bg-muted rounded mx-auto" />
            </td>
            {/* Order Number */}
            <td className="px-5 py-4 space-y-1.5">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted/60 rounded" />
            </td>
            {/* Customer */}
            <td className="px-5 py-4 space-y-1.5">
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted/60 rounded" />
              <div className="h-2.5 w-36 bg-muted/40 rounded" />
            </td>
            {/* Payment & Location */}
            <td className="px-5 py-4 space-y-1.5">
              <div className="h-5 w-20 bg-muted rounded-full" />
              <div className="h-3 w-24 bg-muted/60 rounded" />
            </td>
            {/* Total Amount */}
            <td className="px-5 py-4 space-y-1">
              <div className="h-4 w-16 bg-muted rounded font-bold" />
              <div className="h-3 w-12 bg-muted/60 rounded" />
            </td>
            {/* Status */}
            <td className="px-5 py-4">
              <div className="h-6 w-24 bg-muted rounded-lg" />
            </td>
            {/* Actions */}
            <td className="px-5 py-4 text-right">
              <div className="h-7 w-20 bg-muted rounded-lg ml-auto" />
            </td>
          </tr>
        ))}
      </>
    );
  }

  if (type === "products") {
    return (
      <>
        {rowArray.map((_, i) => (
          <tr key={i} className="animate-pulse border-b border-border/40">
            {/* Checkbox */}
            <td className="w-10 px-3 py-4 text-center">
              <div className="h-4 w-4 bg-muted rounded mx-auto" />
            </td>
            {/* Serial */}
            <td className="w-12 px-3 py-4 text-center">
              <div className="h-4 w-4 bg-muted rounded mx-auto" />
            </td>
            {/* Image & Product Name */}
            <td className="px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-48 bg-muted rounded" />
                  <div className="h-3 w-20 bg-muted/60 rounded" />
                </div>
              </div>
            </td>
            {/* Category */}
            <td className="px-5 py-4">
              <div className="h-5 w-20 bg-muted rounded-full" />
            </td>
            {/* Brand */}
            <td className="px-5 py-4">
              <div className="h-4 w-16 bg-muted rounded" />
            </td>
            {/* Cash Price */}
            <td className="px-5 py-4">
              <div className="h-4 w-16 bg-muted rounded" />
            </td>
            {/* Regular Price */}
            <td className="px-5 py-4">
              <div className="h-3 w-14 bg-muted/60 rounded" />
            </td>
            {/* Stock */}
            <td className="px-5 py-4">
              <div className="h-5 w-16 bg-muted rounded-full" />
            </td>
            {/* Actions */}
            <td className="px-5 py-4 text-right">
              <div className="h-6 w-14 bg-muted rounded ml-auto" />
            </td>
          </tr>
        ))}
      </>
    );
  }

  return (
    <>
      {rowArray.map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-border/40">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <td key={colIdx} className="px-5 py-4">
              <div className="h-4 bg-muted rounded w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
