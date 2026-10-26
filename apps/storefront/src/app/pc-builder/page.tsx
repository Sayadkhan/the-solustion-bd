"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Cpu,
  CircuitBoard,
  Layers,
  Box,
  HardDrive,
  Zap,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  Share2,
  Printer,
  ShoppingCart,
  Plus,
  X,
} from "lucide-react";
import { usePcBuilderStore } from "@/stores/pc-builder-store";
import { useCartStore } from "@/stores/cart-store";
import { CATALOG_PRODUCTS, Product } from "@/lib/catalog";
import { ComponentType, formatBdt } from "@solusation/shared-types";

interface SlotConfig {
  type: ComponentType;
  title: string;
  icon: any;
  categorySlug: string;
  required: boolean;
}

const PC_BUILDER_SLOTS: SlotConfig[] = [
  { type: "CPU", title: "Processor (CPU)", icon: Cpu, categorySlug: "processor", required: true },
  { type: "MOBO", title: "Motherboard", icon: CircuitBoard, categorySlug: "motherboard", required: true },
  { type: "RAM", title: "RAM (Memory)", icon: Box, categorySlug: "ram", required: true },
  { type: "GPU", title: "Graphics Card (GPU)", icon: Layers, categorySlug: "graphics-card", required: false },
  { type: "STORAGE", title: "Storage (M.2 NVMe SSD)", icon: HardDrive, categorySlug: "storage", required: true },
  { type: "PSU", title: "Power Supply Unit (PSU)", icon: Zap, categorySlug: "power-supply", required: true },
  { type: "CASE", title: "Casing", icon: Box, categorySlug: "casing", required: true },
  { type: "MONITOR", title: "Monitor", icon: Monitor, categorySlug: "monitor", required: false },
];

export default function PcBuilderPage() {
  const {
    selected,
    compatibilityResult,
    selectComponent,
    removeComponent,
    clearBuild,
    getTotalCashPriceBdt,
    getTotalRegularPriceBdt,
  } = usePcBuilderStore();

  const addCartItem = useCartStore((s) => s.addItem);

  const [activeSlot, setActiveSlot] = useState<SlotConfig | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const totalCashPrice = getTotalCashPriceBdt();
  const totalRegularPrice = getTotalRegularPriceBdt();

  const handleSelectProduct = (product: Product) => {
    if (!activeSlot) return;
    selectComponent(activeSlot.type, {
      id: product.id,
      name: product.name,
      sku: product.sku,
      cashPriceBdt: product.cashPriceBdt,
      regularPriceBdt: product.regularPriceBdt,
      thumbnailUrl: product.thumbnailUrl,
      specs: product.compatibility as any,
    });
    setActiveSlot(null);
  };

  const handleAddAllToCart = () => {
    Object.values(selected).forEach((comp) => {
      if (comp) {
        addCartItem({
          productId: comp.id,
          name: comp.name,
          sku: comp.sku,
          cashPriceBdt: comp.cashPriceBdt,
          regularPriceBdt: comp.regularPriceBdt,
          thumbnailUrl: comp.thumbnailUrl,
          quantity: 1,
          pricingType: "CASH",
        });
      }
    });
    alert("All configured components have been added to your cart!");
  };

  const handleShare = () => {
    const dummyShortCode = "SOL-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    navigator.clipboard.writeText(window.location.origin + "/pc-builder?build=" + dummyShortCode);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 3000);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Title & Summary Top Bar */}
      <div className="bg-gradient-to-r from-card to-muted/40 p-6 rounded-2xl border border-border shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Online Custom PC Simulator
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            PC Builder & Hardware Compatibility Engine
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
            Choose genuine components with live validation: CPU socket matching, DDR generation verification, and 1.25x PSU wattage safety headroom.
          </p>
        </div>

        {/* Pricing & Actions */}
        <div className="flex flex-wrap items-center gap-4 bg-background p-4 rounded-xl border border-border">
          <div className="text-left">
            <div className="text-[10px] text-muted-foreground uppercase font-bold">
              Total Cash Price
            </div>
            <div className="text-2xl font-black text-primary">
              {formatBdt(totalCashPrice)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              Regular: {formatBdt(totalRegularPrice)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddAllToCart}
              disabled={totalCashPrice === 0}
              className="bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-primary/20 disabled:opacity-50"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>
            <button
              onClick={handleShare}
              className="bg-muted hover:bg-muted/80 text-foreground border border-border font-bold py-2.5 px-3 rounded-xl text-xs flex items-center gap-1.5"
              title="Share Build Link"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedShareLink ? "Copied!" : "Share"}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground"
              title="Print Quotation"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={clearBuild}
              className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-destructive"
              title="Clear Build"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Compatibility Status Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
          compatibilityResult.errors.length > 0
            ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {compatibilityResult.errors.length > 0 ? (
            <XCircle className="w-5 h-5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          )}
          <div>
            <div className="font-bold text-sm">
              {compatibilityResult.errors.length > 0
                ? "Compatibility Issues Detected!"
                : "100% Compatible System Build"}
            </div>
            <div className="text-[11px] opacity-90">
              {compatibilityResult.errors.length > 0
                ? compatibilityResult.errors[0]
                : "All components match socket, memory architecture, and form factor requirements."}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 font-bold">
          <div>
            Estimated TDP: <span className="underline">{compatibilityResult.totalEstimatedTdpWatts}W</span>
          </div>
          <div>
            Recommended PSU: <span className="underline">{compatibilityResult.recommendedPsuWattage}W</span>
          </div>
        </div>
      </div>

      {/* Component Slots Grid */}
      <div className="space-y-3">
        {PC_BUILDER_SLOTS.map((slot) => {
          const comp = selected[slot.type];
          const Icon = slot.icon;

          return (
            <div
              key={slot.type}
              className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:border-primary/40"
            >
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-foreground">
                      {slot.title}
                    </span>
                    {slot.required && (
                      <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">
                        Required
                      </span>
                    )}
                  </div>
                  {comp ? (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      <strong className="text-foreground">{comp.name}</strong> • SKU: {comp.sku}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">No component selected</div>
                  )}
                </div>
              </div>

              {/* Slot Action */}
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
                {comp ? (
                  <>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-primary">
                        {formatBdt(comp.cashPriceBdt)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Regular: {formatBdt(comp.regularPriceBdt)}
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveSlot(slot)}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg"
                    >
                      Change
                    </button>
                    <button
                      onClick={() => removeComponent(slot.type)}
                      className="p-2 text-muted-foreground hover:text-destructive rounded-lg"
                      title="Remove component"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setActiveSlot(slot)}
                    className="bg-primary hover:bg-primary/90 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Choose Component</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Component Picker Modal */}
      {activeSlot && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-3xl rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <activeSlot.icon className="w-5 h-5 text-primary" />
                <h3 className="font-extrabold text-base text-foreground">
                  Select {activeSlot.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveSlot(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of matching products */}
            <div className="p-4 overflow-y-auto divide-y divide-border space-y-2">
              {CATALOG_PRODUCTS.filter(
                (p) => p.categorySlug === activeSlot.categorySlug
              ).map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 hover:bg-muted/30 rounded-xl flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={prod.thumbnailUrl}
                      alt={prod.name}
                      className="w-14 h-14 object-contain rounded-lg bg-muted/30 p-1"
                    />
                    <div className="text-left">
                      <div className="text-xs font-bold text-foreground hover:text-primary">
                        {prod.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {prod.brand} • {prod.warrantyNotice}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-primary">
                        {formatBdt(prod.cashPriceBdt)}
                      </div>
                      <div className="text-[10px] text-muted-foreground line-through">
                        {formatBdt(prod.regularPriceBdt)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectProduct(prod)}
                      className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-4 py-2 rounded-lg"
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
