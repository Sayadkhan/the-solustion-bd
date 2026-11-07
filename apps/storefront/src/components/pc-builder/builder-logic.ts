import { normalizeFormFactor } from "@solusation/shared-types";
import { ApiPcPart, normalizeImageUrl } from "@/lib/api";
import {
  BUILDER_SLOTS,
  BuilderSlot,
  BuildSelection,
  checkBuild,
  SelectedComponent,
} from "@/stores/pc-builder-store";

export type PartsCatalog = Partial<Record<BuilderSlot, ApiPcPart[]>>;

export const REQUIRED_SLOTS: BuilderSlot[] = ["CASE", "MOBO", "CPU", "RAM", "STORAGE", "PSU"];

/** The parts a system cannot start without. */
export const BOOT_SLOTS: BuilderSlot[] = ["MOBO", "CPU", "RAM", "PSU"];

export function toSelectedComponent(part: ApiPcPart): SelectedComponent {
  return {
    id: part.id,
    name: part.name,
    slug: part.slug,
    sku: part.sku,
    brand: part.brand,
    cashPriceBdt: part.cashPriceBdt,
    regularPriceBdt: part.regularPriceBdt,
    thumbnailUrl: normalizeImageUrl(part.image),
    specs: part.compatibility,
  };
}

export function isOrderable(part: Pick<ApiPcPart, "stockStatus" | "totalStock">): boolean {
  if (part.stockStatus === "PRE_ORDER") return true;
  return part.stockStatus === "IN_STOCK" && part.totalStock > 0;
}

/**
 * Why a part would break the current build, or null if it fits. Runs the same
 * rules as the build check, so the two can never disagree.
 */
export function findConflict(
  slot: BuilderSlot,
  part: ApiPcPart,
  selected: BuildSelection
): string | null {
  const before = new Set(checkBuild(selected).errors);
  const after = checkBuild({ ...selected, [slot]: toSelectedComponent(part) });
  return after.errors.find((error) => !before.has(error)) ?? null;
}

/** Replaces saved parts with today's prices and drops anything no longer sold. */
export function reconcileWithCatalog(
  selected: BuildSelection,
  catalog: PartsCatalog
): { selected: BuildSelection; removed: string[] } {
  const next: BuildSelection = {};
  const removed: string[] = [];

  for (const slot of BUILDER_SLOTS) {
    const saved = selected[slot];
    if (!saved) continue;
    const current = catalog[slot]?.find((part) => part.id === saved.id);
    if (current) next[slot] = toSelectedComponent(current);
    else removed.push(saved.name);
  }

  return { selected: next, removed };
}

export const BUILD_PRESETS = [
  { id: "starter", name: "Starter", description: "Everyday use and esports", position: 0 },
  { id: "balanced", name: "Balanced", description: "Smooth 1440p gaming", position: 0.5 },
  { id: "extreme", name: "Extreme", description: "Top parts in stock", position: 1 },
] as const;

export type BuildPreset = (typeof BUILD_PRESETS)[number];

/**
 * Assembles a complete, compatible build from what is in stock. `position` picks
 * how far up the price range each part sits, from 0 (cheapest) to 1 (highest).
 */
export function buildFromPreset(catalog: PartsCatalog, position: number): BuildSelection {
  const selected: BuildSelection = {};

  const candidates = (slot: BuilderSlot) =>
    (catalog[slot] ?? []).filter(isOrderable).sort((a, b) => a.cashPriceBdt - b.cashPriceBdt);

  const pick = (slot: BuilderSlot, fits: (part: ApiPcPart) => boolean = () => true) => {
    const options = candidates(slot).filter(fits);
    if (options.length === 0) return;
    selected[slot] = toSelectedComponent(options[Math.round((options.length - 1) * position)]);
  };

  const sameSocket = (part: ApiPcPart) =>
    !selected.CPU?.specs.socket ||
    part.compatibility.socket?.toLowerCase() === selected.CPU.specs.socket.toLowerCase();

  const sameMemory = (part: ApiPcPart) =>
    !selected.MOBO?.specs.supportedRam ||
    (selected.MOBO.specs.supportedRam.toUpperCase().includes(
      part.compatibility.supportedRam?.toUpperCase() ?? ""
    ) as boolean);

  const fitsBoard = (part: ApiPcPart) => {
    const size = ["ITX", "MATX", "ATX"];
    const board = normalizeFormFactor(selected.MOBO?.specs.formFactor);
    const chassis = normalizeFormFactor(part.compatibility.formFactor);
    return !board || !chassis || size.indexOf(board) <= size.indexOf(chassis);
  };

  pick("CPU");
  pick("MOBO", sameSocket);
  pick("RAM", sameMemory);
  pick("GPU");
  pick("STORAGE");
  pick("COOLER");
  pick("CASE", fitsBoard);

  // The power supply comes last, as it depends on everything else. It takes the
  // smallest unit with enough headroom rather than a price position.
  const required = checkBuild(selected).recommendedPsuWattage;
  const psu = candidates("PSU")
    .filter((part) => (part.compatibility.psuWattage ?? 0) >= required)
    .sort((a, b) => (a.compatibility.psuWattage ?? 0) - (b.compatibility.psuWattage ?? 0))[0];
  if (psu) selected.PSU = toSelectedComponent(psu);

  return selected;
}
