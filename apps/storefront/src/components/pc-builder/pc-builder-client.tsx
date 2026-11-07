"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  AlertTriangle,
  Box,
  Boxes,
  CheckCircle2,
  CircuitBoard,
  Cpu,
  Fan as FanIcon,
  HardDrive,
  Layers,
  Link2,
  Loader2,
  MemoryStick,
  Monitor,
  PanelTop,
  Plus,
  Power,
  Printer,
  RotateCcw,
  ShoppingCart,
  Trash2,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { formatBdt } from "@solusation/shared-types";
import { ApiPcPart, ApiPcValidation, storefrontApi } from "@/lib/api";
import { useCartStore } from "@/stores/cart-store";
import {
  BUILDER_SLOTS,
  BuilderSlot,
  BuildSelection,
  checkBuild,
  SelectedComponent,
  usePcBuilderStore,
} from "@/stores/pc-builder-store";
import {
  BOOT_SLOTS,
  BUILD_PRESETS,
  buildFromPreset,
  PartsCatalog,
  reconcileWithCatalog,
  REQUIRED_SLOTS,
  toSelectedComponent,
} from "./builder-logic";
import { PartPicker } from "./part-picker";
import type { PowerState } from "./pc-scene";

// three.js is large and browser-only, so it loads only on this page.
const PcScene = dynamic(() => import("./pc-scene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm gap-2">
      <Loader2 className="w-4 h-4 animate-spin" /> Preparing the 3D workbench
    </div>
  ),
});

const SLOT_INFO: Record<BuilderSlot, { title: string; icon: React.ComponentType<{ className?: string }> }> = {
  CASE: { title: "Casing", icon: Box },
  MOBO: { title: "Motherboard", icon: CircuitBoard },
  CPU: { title: "Processor", icon: Cpu },
  COOLER: { title: "CPU Cooler", icon: FanIcon },
  RAM: { title: "Memory", icon: MemoryStick },
  GPU: { title: "Graphics Card", icon: Layers },
  STORAGE: { title: "Storage", icon: HardDrive },
  PSU: { title: "Power Supply", icon: Zap },
  MONITOR: { title: "Monitor", icon: Monitor },
};

const RGB_COLORS = [
  { name: "Ice blue", value: "#3f8cff" },
  { name: "Violet", value: "#9a5cff" },
  { name: "Red", value: "#ff3347" },
  { name: "Green", value: "#27e08a" },
  { name: "White", value: "#f2f5ff" },
];

const FPS_RATING_STYLE: Record<string, string> = {
  playable: "bg-amber-500",
  smooth: "bg-sky-500",
  competitive: "bg-violet-500",
  ultra: "bg-emerald-500",
};

function hasWebGl(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function PcBuilderClient() {
  const { selected, selectComponent, removeComponent, setBuild, clearBuild } = usePcBuilderStore();
  const addCartItem = useCartStore((state) => state.addItem);

  const [catalog, setCatalog] = useState<PartsCatalog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "good" | "info"; text: string; href?: string } | null>(null);

  const [pickerSlot, setPickerSlot] = useState<BuilderSlot | null>(null);
  const [hoverSlot, setHoverSlot] = useState<BuilderSlot | null>(null);
  const [focusSlot, setFocusSlot] = useState<BuilderSlot | null>(null);
  const [viewResetKey, setViewResetKey] = useState(0);

  const [power, setPower] = useState<PowerState>("off");
  const [screenLines, setScreenLines] = useState<string[]>([]);
  const [rgb, setRgb] = useState(RGB_COLORS[0].value);
  const [exploded, setExploded] = useState(false);
  const [showGlass, setShowGlass] = useState(true);
  const [webGlReady, setWebGlReady] = useState<boolean | null>(null);

  const [estimates, setEstimates] = useState<ApiPcValidation | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const bootRun = useRef(0);

  const compatibility = useMemo(() => checkBuild(selected), [selected]);
  const selectedParts = useMemo(
    () => BUILDER_SLOTS.flatMap((slot) => (selected[slot] ? [[slot, selected[slot]!] as const] : [])),
    [selected]
  );
  const totalCash = selectedParts.reduce((sum, [, part]) => sum + part.cashPriceBdt, 0);
  const totalRegular = selectedParts.reduce((sum, [, part]) => sum + part.regularPriceBdt, 0);
  const missingRequired = REQUIRED_SLOTS.filter((slot) => !selected[slot]);
  const psuWatts = selected.PSU?.specs.psuWattage ?? 0;
  const loadPercent = psuWatts ? Math.round((compatibility.totalEstimatedTdpWatts / psuWatts) * 100) : 0;

  const loadCatalog = useCallback(async () => {
    setLoadError(null);
    try {
      setCatalog((await storefrontApi.getPcParts()) as PartsCatalog);
    } catch {
      setLoadError("We could not load the components. Please check your connection and try again.");
    }
  }, []);

  useEffect(() => {
    setWebGlReady(hasWebGl());
    Promise.resolve(usePcBuilderStore.persist.rehydrate()).finally(loadCatalog);
  }, [loadCatalog]);

  // Once the catalogue arrives: open a shared build, or refresh the saved one.
  const catalogApplied = useRef(false);
  useEffect(() => {
    if (!catalog || catalogApplied.current) return;
    catalogApplied.current = true;

    const shortCode = new URLSearchParams(window.location.search).get("build");
    const applySaved = () => {
      const { selected: fresh, removed } = reconcileWithCatalog(usePcBuilderStore.getState().selected, catalog);
      setBuild(fresh);
      if (removed.length > 0) {
        setNotice({ tone: "info", text: `No longer available and removed: ${removed.join(", ")}` });
      }
    };

    if (!shortCode) {
      applySaved();
      return;
    }

    storefrontApi.getSharedPcBuild(shortCode).then((components) => {
      if (!components) {
        setNotice({ tone: "info", text: "That build link was not found. Showing your own build." });
        applySaved();
        return;
      }
      const shared: BuildSelection = {};
      for (const slot of BUILDER_SLOTS) {
        const part = catalog[slot]?.find((candidate) => candidate.id === components[slot]);
        if (part) shared[slot] = toSelectedComponent(part);
      }
      setBuild(shared);
      setNotice({ tone: "good", text: `Loaded shared build ${shortCode}. Current prices are shown.` });
    });
  }, [catalog, setBuild]);

  // Performance estimates come from the server, so they use the database's numbers.
  const componentIds = useMemo(
    () => Object.fromEntries(selectedParts.map(([slot, part]) => [slot, part.id])),
    [selectedParts]
  );
  useEffect(() => {
    if (!catalog) return;
    if (selectedParts.length === 0) {
      setEstimates(null);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      const result = await storefrontApi.validatePcBuild(componentIds);
      if (active) setEstimates(result);
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [componentIds, catalog, selectedParts.length]);

  const stopPower = useCallback(() => {
    bootRun.current += 1;
    setPower("off");
    setScreenLines([]);
  }, []);

  // Changing hardware while running is not something a real PC survives either.
  const changed = useRef(false);
  const markChanged = () => {
    changed.current = true;
    stopPower();
  };

  const handleSelect = (part: ApiPcPart) => {
    if (!pickerSlot) return;
    selectComponent(pickerSlot, toSelectedComponent(part));
    setPickerSlot(null);
    setFocusSlot(null);
    markChanged();
  };

  const handleSlotClick = useCallback((slot: BuilderSlot) => {
    setPickerSlot(slot);
    setFocusSlot(slot);
  }, []);

  const closePicker = useCallback(() => {
    setPickerSlot(null);
    setFocusSlot(null);
  }, []);

  const applyPreset = (position: number, name: string) => {
    if (!catalog) return;
    const build = buildFromPreset(catalog, position);
    setBuild(build);
    markChanged();
    setExploded(false);
    setFocusSlot(null);
    setViewResetKey((key) => key + 1);
    setNotice({ tone: "good", text: `${name} build assembled from parts in stock. Change anything you like.` });
  };

  const togglePower = async () => {
    if (power !== "off") {
      stopPower();
      return;
    }

    const run = ++bootRun.current;
    const lines: string[] = [];
    const print = async (line: string, delay = 280) => {
      await wait(delay);
      if (bootRun.current !== run) return false;
      lines.push(line);
      setScreenLines([...lines]);
      return true;
    };

    setExploded(false);
    setPower("booting");
    setScreenLines([]);

    const missing = BOOT_SLOTS.filter((slot) => !selected[slot]);
    if (missing.length > 0) {
      await print("Power on... no signal", 300);
      if (bootRun.current !== run) return;
      await wait(700);
      if (bootRun.current !== run) return;
      setPower("failed");
      await print(`Cannot start. Missing: ${missing.map((slot) => SLOT_INFO[slot].title).join(", ")}`, 0);
      return;
    }

    if (!(await print("The Solutions BD System Check v1.0"))) return;
    if (!(await print(`CPU     ${selected.CPU!.name}`))) return;
    if (!(await print(`Board   ${selected.MOBO!.name}`))) return;
    if (!(await print(`Memory  ${selected.RAM!.name}`))) return;
    if (selected.GPU && !(await print(`GPU     ${selected.GPU.name}`))) return;
    if (selected.STORAGE && !(await print(`Drive   ${selected.STORAGE.name}`))) return;
    if (!(await print(`Power   ${compatibility.totalEstimatedTdpWatts}W estimated of ${psuWatts}W available`))) return;

    if (compatibility.errors.length > 0) {
      await wait(350);
      if (bootRun.current !== run) return;
      setPower("failed");
      await print(`STOP: ${compatibility.errors[0]}`, 0);
      return;
    }

    if (!(await print("All checks passed.", 400))) return;
    if (!selected.STORAGE) {
      await print("No boot drive found. Add storage to install an operating system.");
    }
    setPower("on");
  };

  const handleAddAllToCart = () => {
    selectedParts.forEach(([, part]) => {
      addCartItem({
        productId: part.id,
        name: part.name,
        sku: part.sku,
        slug: part.slug,
        cashPriceBdt: part.cashPriceBdt,
        regularPriceBdt: part.regularPriceBdt,
        thumbnailUrl: part.thumbnailUrl,
        pricingType: "CASH",
      });
    });
    setNotice({ tone: "good", text: `${selectedParts.length} parts added to your cart.`, href: "/cart" });
  };

  const handleShare = async () => {
    setIsSharing(true);
    const code = await storefrontApi.savePcBuild(componentIds);
    setIsSharing(false);
    if (!code) {
      setNotice({ tone: "info", text: "We could not save this build. Please try again." });
      return;
    }
    const url = `${window.location.origin}/pc-builder?build=${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setNotice({ tone: "good", text: `Link copied: ${url}` });
    } catch {
      setNotice({ tone: "good", text: `Share this link: ${url}` });
    }
  };

  const handleClear = () => {
    clearBuild();
    stopPower();
    setExploded(false);
    setFocusSlot(null);
    setViewResetKey((key) => key + 1);
    setNotice(null);
    window.history.replaceState(null, "", "/pc-builder");
  };

  const hovered = hoverSlot ? { slot: hoverSlot, part: selected[hoverSlot] } : null;
  const isRunning = power === "on" || power === "booting";

  const isEmpty = selectedParts.length === 0;

  return (
    <div>
      <div className="print:hidden grid lg:grid-cols-[300px_minmax(0,1fr)_320px] xl:grid-cols-[330px_minmax(0,1fr)_350px] lg:h-[calc(100vh-var(--header-height))] lg:min-h-[640px]">
        {/* ---------- Stage ---------- */}
        <section
          aria-label="3D view of your PC"
          className="order-1 lg:order-2 relative min-h-[58vh] lg:min-h-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_38%,#1b2230_0%,#0c0f14_62%,#07090c_100%)]"
        >
          {webGlReady === false ? (
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-slate-300 text-sm">
              <p className="max-w-xs">
                Your browser cannot show the 3D view. You can still choose parts and check compatibility using the list.
              </p>
            </div>
          ) : webGlReady ? (
            <PcScene
              selected={selected}
              conflicts={compatibility.conflicts as BuilderSlot[]}
              power={power}
              screenLines={screenLines}
              rgb={rgb}
              exploded={exploded}
              showGlass={showGlass}
              focusSlot={focusSlot}
              viewResetKey={viewResetKey}
              onSlotClick={handleSlotClick}
              onSlotHover={setHoverSlot}
            />
          ) : null}

          {/* Status, top left */}
          <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 flex items-start justify-between gap-3 pointer-events-none">
            <div className="min-w-0 rounded-lg bg-black/45 backdrop-blur-sm border border-white/10 px-3 py-2 text-white">
              {hovered ? (
                <>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-sky-300">
                    {SLOT_INFO[hovered.slot].title}
                  </div>
                  <div className="text-xs font-medium truncate max-w-[60vw] lg:max-w-sm">
                    {hovered.part ? `${hovered.part.name} · click to change` : "Click to choose"}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-slate-400">3D workbench</div>
                  <div className="text-xs font-medium">
                    Drag to rotate · <span className="hidden sm:inline">Scroll</span>
                    <span className="sm:hidden">Pinch</span> to zoom · <span className="hidden sm:inline">Click</span>
                    <span className="sm:hidden">Tap</span> a part
                  </div>
                </>
              )}
            </div>
          </div>

          {/* First-run presets */}
          {isEmpty && catalog && (
            <div className="absolute inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 top-1/2 -translate-y-1/2 sm:w-[440px] rounded-2xl bg-black/55 backdrop-blur-md border border-white/10 p-5 text-center text-white">
              <h2 className="text-lg font-bold">Start with a complete build</h2>
              <p className="text-xs text-slate-300 mt-1 mb-4">
                Assembled from what is in stock today, then change any part. Or pick parts one by one from the list.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {BUILD_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.position, preset.name)}
                    className="rounded-xl border border-white/15 hover:border-sky-300/70 hover:bg-white/5 p-3 text-left transition-colors"
                  >
                    <div className="text-sm font-semibold">{preset.name}</div>
                    <div className="text-[11px] leading-snug text-slate-400 mt-0.5">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Start-up log */}
          {screenLines.length > 0 && (
            <div
              role="status"
              className={`absolute left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md bottom-[6.5rem] sm:bottom-20 rounded-lg bg-black/70 backdrop-blur-sm border p-3 font-mono text-[11px] leading-relaxed [&>div:nth-last-child(n+4)]:hidden sm:[&>div:nth-last-child(n+4)]:block ${
                power === "failed" ? "border-red-500/60 text-red-200" : "border-white/10 text-emerald-200"
              }`}
            >
              {screenLines.map((line, i) => (
                <div key={i} className="truncate">
                  {line}
                </div>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={togglePower}
              className={`stage-button font-semibold px-4 ${
                isRunning ? "!bg-emerald-500 !border-emerald-400 !text-black" : power === "failed" ? "!border-red-500 !text-red-200" : ""
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isRunning ? "Power off" : power === "failed" ? "Reset" : "Power on"}</span>
            </button>

            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <div className="flex items-center gap-1 rounded-lg bg-black/45 backdrop-blur-sm border border-white/10 px-2 py-1.5" role="radiogroup" aria-label="Lighting colour">
                {RGB_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    role="radio"
                    aria-checked={rgb === color.value}
                    aria-label={color.name}
                    title={color.name}
                    onClick={() => setRgb(color.value)}
                    className={`w-4 h-4 rounded-full transition-transform ${rgb === color.value ? "ring-2 ring-white ring-offset-1 ring-offset-black scale-110" : "hover:scale-110"}`}
                    style={{ background: color.value }}
                  />
                ))}
              </div>
              <button type="button" onClick={() => setExploded((value) => !value)} aria-pressed={exploded} className={`stage-button ${exploded ? "stage-button-on" : ""}`}>
                <Boxes className="w-4 h-4" />
                <span className="hidden sm:inline">Exploded</span>
              </button>
              <button type="button" onClick={() => setShowGlass((value) => !value)} aria-pressed={!showGlass} className={`stage-button ${!showGlass ? "stage-button-on" : ""}`}>
                <PanelTop className="w-4 h-4" />
                <span className="hidden sm:inline">{showGlass ? "Remove glass" : "Add glass"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFocusSlot(null);
                  setViewResetKey((key) => key + 1);
                }}
                className="stage-button"
                aria-label="Reset view"
                title="Reset view"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ---------- Parts list ---------- */}
        <aside className="order-2 lg:order-1 border-r border-border bg-card lg:overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="eyebrow">PC Builder</div>
            <h1 className="text-lg font-bold text-foreground leading-tight">Build your PC in 3D</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {missingRequired.length === 0
                ? "All required parts are in place."
                : `${REQUIRED_SLOTS.length - missingRequired.length} of ${REQUIRED_SLOTS.length} required parts chosen.`}
            </p>
            <div className="mt-2.5 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full spectrum-line transition-all duration-500"
                style={{ width: `${((REQUIRED_SLOTS.length - missingRequired.length) / REQUIRED_SLOTS.length) * 100}%` }}
              />
            </div>
          </div>

          {loadError && (
            <div className="p-4 text-sm text-foreground space-y-2">
              <p>{loadError}</p>
              <button type="button" onClick={loadCatalog} className="btn-primary text-xs px-3 py-1.5">
                Try again
              </button>
            </div>
          )}

          <ul className="flex-1 divide-y divide-border">
            {BUILDER_SLOTS.map((slot) => (
              <SlotRow
                key={slot}
                slot={slot}
                part={selected[slot]}
                count={catalog?.[slot]?.length}
                isLoading={!catalog && !loadError}
                isRequired={REQUIRED_SLOTS.includes(slot)}
                hasConflict={compatibility.conflicts.includes(slot)}
                isHovered={hoverSlot === slot}
                onChoose={() => handleSlotClick(slot)}
                onRemove={() => {
                  removeComponent(slot);
                  markChanged();
                }}
                onHover={setHoverSlot}
              />
            ))}
          </ul>
        </aside>

        {/* ---------- Summary ---------- */}
        <aside className="order-3 border-l border-border bg-card lg:overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="eyebrow">Cash price</div>
            <div className="text-3xl font-bold text-foreground tabular-nums tracking-tight">{formatBdt(totalCash)}</div>
            {totalRegular > totalCash && (
              <div className="text-xs text-muted-foreground mt-0.5">
                Regular <span className="line-through tabular-nums">{formatBdt(totalRegular)}</span>
                <span className="text-success font-medium"> · save {formatBdt(totalRegular - totalCash)}</span>
              </div>
            )}

            {notice && (
              <div className={`mt-3 rounded-lg border p-2.5 text-xs flex gap-2 ${notice.tone === "good" ? "border-success/30 bg-success/10" : "border-border bg-muted"}`}>
                <span className="flex-1 text-foreground break-words min-w-0">
                  {notice.text}{" "}
                  {notice.href && (
                    <Link href={notice.href} className="font-semibold text-primary underline underline-offset-2">
                      View cart
                    </Link>
                  )}
                </span>
                <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleAddAllToCart}
              disabled={isEmpty}
              className="btn-primary w-full mt-3 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Add build to cart</span>
            </button>

            <div className="grid grid-cols-3 gap-1.5 mt-2">
              <button type="button" onClick={handleShare} disabled={isEmpty || isSharing} className="btn-secondary text-xs py-2 disabled:opacity-40">
                {isSharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                Share
              </button>
              <button type="button" onClick={() => window.print()} disabled={isEmpty} className="btn-secondary text-xs py-2 disabled:opacity-40">
                <Printer className="w-3.5 h-3.5" />
                Quote
              </button>
              <button type="button" onClick={handleClear} disabled={isEmpty} className="btn-secondary text-xs py-2 hover:!text-destructive disabled:opacity-40">
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
          </div>

          {/* Compatibility */}
          <div className="p-4 border-b border-border space-y-2">
            <h2 className="eyebrow">Compatibility</h2>
            {compatibility.errors.length > 0 ? (
              compatibility.errors.map((error) => (
                <p key={error} className="flex gap-2 text-xs text-destructive leading-snug">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </p>
              ))
            ) : isEmpty ? (
              <p className="text-xs text-muted-foreground">Add parts and we will check they work together.</p>
            ) : (
              <p className="flex gap-2 text-xs text-foreground leading-snug">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-success" />
                <span>Socket, memory, size and power all match so far.</span>
              </p>
            )}
            {selected.CPU && !selected.COOLER && (catalog?.COOLER?.length ?? 0) > 0 && (
              <p className="flex gap-2 text-xs text-muted-foreground leading-snug">
                <AlertTriangle className="w-4 h-4 shrink-0 text-warning" />
                <span>No cooler chosen. Check whether your processor includes one in the box.</span>
              </p>
            )}
          </div>

          {/* Power */}
          <div className="p-4 border-b border-border space-y-2">
            <h2 className="eyebrow">Power</h2>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">Estimated draw</span>
              <span className="font-mono text-foreground">
                {compatibility.totalEstimatedTdpWatts}W{psuWatts ? ` / ${psuWatts}W` : ""}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden" role="meter" aria-valuenow={loadPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Power supply load">
              <div
                className={`h-full rounded-full transition-all duration-500 ${loadPercent > 80 ? "bg-destructive" : loadPercent > 60 ? "bg-warning" : "bg-success"}`}
                style={{ width: `${Math.min(loadPercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {psuWatts
                ? `${loadPercent}% of your power supply. We recommend staying under 80%.`
                : `A ${compatibility.recommendedPsuWattage}W power supply or larger is recommended.`}
            </p>
          </div>

          {/* Performance */}
          <div className="p-4 space-y-2.5">
            <h2 className="eyebrow">Estimated gaming performance</h2>
            {estimates && estimates.estimatedFps.length > 0 && (selected.GPU || selected.CPU) ? (
              <>
                {estimates.estimatedFps.map((game) => (
                  <div key={game.gameTitle}>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="text-foreground truncate">{game.gameTitle}</span>
                      <span className="font-mono text-foreground shrink-0">{game.averageFps} FPS</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${FPS_RATING_STYLE[game.experienceRating]}`}
                          style={{ width: `${Math.min(100, (game.averageFps / 240) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {game.resolution} · {game.preset}
                      </span>
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground pt-1">
                  Rough estimates from benchmark scores. Real results vary by game and settings.
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Choose a graphics card to see estimates.</p>
            )}
          </div>
        </aside>
      </div>

      {/* Printed quotation */}
      <PrintQuote parts={selectedParts} total={totalCash} />

      {pickerSlot && (
        <PartPicker
          slot={pickerSlot}
          title={SLOT_INFO[pickerSlot].title}
          parts={catalog?.[pickerSlot] ?? []}
          selected={selected}
          onSelect={handleSelect}
          onClose={closePicker}
        />
      )}
    </div>
  );
}

function SlotRow({
  slot,
  part,
  count,
  isLoading,
  isRequired,
  hasConflict,
  isHovered,
  onChoose,
  onRemove,
  onHover,
}: {
  slot: BuilderSlot;
  part?: SelectedComponent;
  count?: number;
  isLoading: boolean;
  isRequired: boolean;
  hasConflict: boolean;
  isHovered: boolean;
  onChoose: () => void;
  onRemove: () => void;
  onHover: (slot: BuilderSlot | null) => void;
}) {
  const { title, icon: Icon } = SLOT_INFO[slot];

  return (
    <li
      onMouseEnter={() => onHover(slot)}
      onMouseLeave={() => onHover(null)}
      className={`relative group transition-colors ${isHovered ? "bg-muted/70" : ""} ${hasConflict ? "bg-destructive/5" : ""}`}
    >
      <button
        type="button"
        onClick={onChoose}
        disabled={isLoading}
        className="w-full flex items-center gap-3 px-4 py-3 text-left disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <span
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            hasConflict
              ? "bg-destructive/15 text-destructive"
              : part
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="w-[18px] h-[18px]" />
        </span>
        <span className="min-w-0 flex-1 pr-6">
          <span className="block text-[11px] font-medium text-muted-foreground">
            {title}
            {isRequired && !part && <span className="text-primary"> · required</span>}
          </span>
          {part ? (
            <>
              <span className="block text-xs font-semibold text-foreground leading-snug line-clamp-2">{part.name}</span>
              <span className="block text-xs text-muted-foreground tabular-nums">{formatBdt(part.cashPriceBdt)}</span>
            </>
          ) : (
            <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
              {isLoading ? (
                <span className="inline-block h-3 w-24 rounded bg-muted animate-pulse" />
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Choose
                  {count !== undefined && <span className="font-normal text-muted-foreground">({count})</span>}
                </>
              )}
            </span>
          )}
        </span>
      </button>
      {part && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${title}`}
          className="absolute right-3 top-3 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </li>
  );
}

function PrintQuote({ parts, total }: { parts: ReadonlyArray<readonly [BuilderSlot, SelectedComponent]>; total: number }) {
  return (
    <div className="hidden print:block p-8 text-black bg-white">
      <h1 className="text-xl font-bold">The Solutions BD: PC Build Quotation</h1>
      <p className="text-xs mb-4">Cash prices. Valid on the date printed, subject to stock.</p>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-black text-left">
            <th className="py-1.5">Part</th>
            <th className="py-1.5">Product</th>
            <th className="py-1.5">SKU</th>
            <th className="py-1.5 text-right">Price</th>
          </tr>
        </thead>
        <tbody>
          {parts.map(([slot, part]) => (
            <tr key={slot} className="border-b border-gray-300">
              <td className="py-1.5 pr-3">{SLOT_INFO[slot].title}</td>
              <td className="py-1.5 pr-3">{part.name}</td>
              <td className="py-1.5 pr-3 font-mono text-xs">{part.sku}</td>
              <td className="py-1.5 text-right tabular-nums">{formatBdt(part.cashPriceBdt)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="py-2 font-bold">
              Total
            </td>
            <td className="py-2 text-right font-bold tabular-nums">{formatBdt(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
