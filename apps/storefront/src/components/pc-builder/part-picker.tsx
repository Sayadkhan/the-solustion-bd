"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Search, X } from "lucide-react";
import { formatBdt } from "@solusation/shared-types";
import { ApiPcPart, normalizeImageUrl } from "@/lib/api";
import type { BuilderSlot, BuildSelection } from "@/stores/pc-builder-store";
import { findConflict, isOrderable } from "./builder-logic";

type SortKey = "price-asc" | "price-desc" | "name";

const STOCK_LABEL: Partial<Record<ApiPcPart["stockStatus"], string>> = {
  OUT_OF_STOCK: "Out of stock",
  UPCOMING: "Coming soon",
  CALL_FOR_PRICE: "Call for price",
  PRE_ORDER: "Pre-order",
};

function specSummary(part: ApiPcPart): string[] {
  const { socket, supportedRam, formFactor, tdpWatts, psuWattage } = part.compatibility;
  return [
    socket,
    supportedRam,
    formFactor,
    psuWattage ? `${psuWattage}W` : tdpWatts ? `${tdpWatts}W TDP` : null,
  ].filter((value): value is string => Boolean(value));
}

export function PartPicker({
  slot,
  title,
  parts,
  selected,
  onSelect,
  onClose,
}: {
  slot: BuilderSlot;
  title: string;
  parts: ApiPcPart[];
  selected: BuildSelection;
  onSelect: (part: ApiPcPart) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("price-asc");
  const [compatibleOnly, setCompatibleOnly] = useState(true);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return parts
      .map((part) => ({ part, conflict: findConflict(slot, part, selected) }))
      .filter(({ part, conflict }) => {
        if (compatibleOnly && conflict) return false;
        if (!term) return true;
        return `${part.name} ${part.brand ?? ""} ${part.sku}`.toLowerCase().includes(term);
      })
      .sort((a, b) => {
        // Parts that can be bought come first, whatever the sort order.
        const available = Number(isOrderable(b.part)) - Number(isOrderable(a.part));
        if (available !== 0) return available;
        if (sort === "name") return a.part.name.localeCompare(b.part.name);
        const difference = a.part.cashPriceBdt - b.part.cashPriceBdt;
        return sort === "price-asc" ? difference : -difference;
      });
  }, [parts, slot, selected, query, sort, compatibleOnly]);

  const hiddenCount = compatibleOnly
    ? parts.filter((part) => findConflict(slot, part, selected)).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end print:hidden" role="dialog" aria-modal="true" aria-label={`Choose ${title}`}>
      <button type="button" className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} aria-label="Close" tabIndex={-1} />

      <div className="relative w-full sm:max-w-[480px] h-full bg-card border-l border-border flex flex-col animate-in slide-in-from-right duration-200">
        <div className="p-4 sm:p-5 border-b border-border space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="eyebrow">Choose a part</div>
              <h2 className="text-lg font-bold text-foreground">{title}</h2>
            </div>
            <button
              ref={closeButton}
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${parts.length} products`}
              aria-label={`Search ${title}`}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            <label className="flex items-center gap-2 text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={compatibleOnly}
                onChange={(event) => setCompatibleOnly(event.target.checked)}
                className="accent-[hsl(var(--primary))] w-4 h-4"
              />
              <span>
                Compatible only
                {hiddenCount > 0 && <span className="text-muted-foreground"> ({hiddenCount} hidden)</span>}
              </span>
            </label>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              aria-label="Sort products"
              className="px-2 py-1.5 rounded-lg bg-background border border-border text-foreground outline-none"
            >
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {rows.length === 0 && (
            <div className="text-center py-14 px-6 space-y-2">
              <p className="font-semibold text-foreground">
                {parts.length === 0 ? "None in the catalogue yet" : "No matching products"}
              </p>
              <p className="text-sm text-muted-foreground">
                {parts.length === 0
                  ? "This part type has no products at the moment. Call us and we can source one."
                  : hiddenCount > 0
                  ? "Your other parts rule these out. Turn off “Compatible only” to see why."
                  : "Try a different search."}
              </p>
            </div>
          )}

          {rows.map(({ part, conflict }) => {
            const isCurrent = selected[slot]?.id === part.id;
            const orderable = isOrderable(part);
            const stockLabel = STOCK_LABEL[part.stockStatus] ?? (part.totalStock <= 0 ? "Out of stock" : null);
            const specs = specSummary(part);

            return (
              <div
                key={part.id}
                className={`rounded-xl border p-3 flex gap-3 transition-colors ${
                  isCurrent ? "border-primary bg-primary/5" : "border-border hover:border-foreground/25"
                }`}
              >
                <div className="w-16 h-16 rounded-lg bg-white shrink-0 overflow-hidden flex items-center justify-center">
                  <img
                    src={normalizeImageUrl(part.image)}
                    alt=""
                    loading="lazy"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{part.name}</p>

                  {specs.length > 0 && (
                    <p className="font-mono text-[11px] text-muted-foreground truncate">{specs.join(" · ")}</p>
                  )}

                  {conflict && (
                    <p className="text-xs text-destructive flex gap-1.5 leading-snug">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                      <span>{conflict}</span>
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-foreground tabular-nums">{formatBdt(part.cashPriceBdt)}</span>
                      {stockLabel && (
                        <span className={`ml-2 text-[11px] font-medium ${orderable ? "text-primary" : "text-muted-foreground"}`}>
                          {stockLabel}
                        </span>
                      )}
                    </div>

                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary px-2 py-1.5">
                        <Check className="w-3.5 h-3.5" /> Selected
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!orderable}
                        onClick={() => onSelect(part)}
                        className="btn-primary text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {conflict ? "Use anyway" : "Select"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
