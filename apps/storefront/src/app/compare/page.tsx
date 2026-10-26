"use client";

import React from "react";
import Link from "next/link";
import {
  GitCompare,
  Trash2,
  ShoppingCart,
  Plus,
  CheckCircle2,
  XCircle,
  Cpu,
} from "lucide-react";
import { useCompareStore, CompareProduct } from "@/stores/compare-store";
import { useCartStore } from "@/stores/cart-store";
import { formatBdt } from "@solusation/shared-types";

export default function ComparePage() {
  const items = useCompareStore((s) => s.items);
  const removeComponent = useCompareStore((s) => s.removeComponent);
  const clearAll = useCompareStore((s) => s.clearAll);
  const addItem = useCartStore((s) => s.addItem);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
          <GitCompare className="w-8 h-8 stroke-1" />
        </div>
        <h2 className="text-2xl font-black text-foreground">No Products in Comparison</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Compare up to 4 hardware products side-by-side to review technical specifications, sockets, TDP, and dual pricing.
        </p>
        <Link
          href="/products"
          className="inline-block bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-xs hover:bg-primary/90 shadow-md shadow-primary/20"
        >
          Browse Hardware Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
            <GitCompare className="w-7 h-7 text-primary" />
            <span>Product Comparison ({items.length} of 4)</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Compare technical specifications, dual pricing, and hardware compatibility.
          </p>
        </div>
        <button
          onClick={clearAll}
          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      {/* Comparison Grid Table */}
      <div className="overflow-x-auto pb-4">
        <table className="w-full min-w-[700px] border-collapse bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="p-4 text-left text-xs font-bold text-muted-foreground w-48">
                Specification
              </th>
              {items.map((item: CompareProduct) => (
                <th key={item.id} className="p-4 text-center min-w-[220px]">
                  <div className="flex justify-end">
                    <button
                      onClick={() => removeComponent(item.id)}
                      className="p-1 text-muted-foreground hover:text-destructive rounded"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="w-28 h-28 mx-auto p-2 bg-background rounded-xl border border-border/60 flex items-center justify-center my-2">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <h4 className="font-bold text-xs text-foreground line-clamp-2 h-8 leading-tight">
                    {item.name}
                  </h4>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    SKU: {item.sku}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {/* Cash Discount Price */}
            <tr>
              <td className="p-4 font-bold text-foreground bg-muted/20">
                Special Cash Price
              </td>
              {items.map((item: CompareProduct) => (
                <td key={item.id} className="p-4 text-center font-black text-base text-primary">
                  {formatBdt(item.cashPriceBdt)}
                </td>
              ))}
            </tr>

            {/* Regular Price */}
            <tr>
              <td className="p-4 font-semibold text-muted-foreground bg-muted/20">
                Regular / EMI Price
              </td>
              {items.map((item: CompareProduct) => (
                <td key={item.id} className="p-4 text-center font-bold text-foreground">
                  {formatBdt(item.regularPriceBdt)}
                </td>
              ))}
            </tr>

            {/* Socket */}
            <tr>
              <td className="p-4 font-semibold text-muted-foreground bg-muted/20">
                Socket / Platform
              </td>
              {items.map((item: CompareProduct) => (
                <td key={item.id} className="p-4 text-center font-bold text-foreground">
                  {item.specs?.socket || "N/A"}
                </td>
              ))}
            </tr>

            {/* Memory Support */}
            <tr>
              <td className="p-4 font-semibold text-muted-foreground bg-muted/20">
                Supported Memory
              </td>
              {items.map((item: CompareProduct) => (
                <td key={item.id} className="p-4 text-center font-bold text-foreground">
                  {item.specs?.supportedRam || "N/A"}
                </td>
              ))}
            </tr>

            {/* TDP */}
            <tr>
              <td className="p-4 font-semibold text-muted-foreground bg-muted/20">
                Power Draw (TDP)
              </td>
              {items.map((item: CompareProduct) => (
                <td key={item.id} className="p-4 text-center font-bold text-foreground">
                  {item.specs?.tdpWatts ? `${item.specs.tdpWatts} Watts` : "N/A"}
                </td>
              ))}
            </tr>

            {/* Benchmark Score */}
            <tr>
              <td className="p-4 font-semibold text-muted-foreground bg-muted/20">
                Hardware Benchmark
              </td>
              {items.map((item: CompareProduct) => (
                <td key={item.id} className="p-4 text-center font-extrabold text-amber-500">
                  {item.specs?.benchmarkScore ? `${item.specs.benchmarkScore} Pts` : "Standard"}
                </td>
              ))}
            </tr>

            {/* Action Row */}
            <tr>
              <td className="p-4 bg-muted/20"></td>
              {items.map((item: CompareProduct) => (
                <td key={item.id} className="p-4 text-center">
                  <button
                    onClick={() =>
                      addItem({
                        id: item.id,
                        name: item.name,
                        sku: item.sku,
                        cashPriceBdt: item.cashPriceBdt,
                        regularPriceBdt: item.regularPriceBdt,
                        thumbnailUrl: item.thumbnailUrl,
                        quantity: 1,
                        pricingType: "CASH",
                      })
                    }
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
