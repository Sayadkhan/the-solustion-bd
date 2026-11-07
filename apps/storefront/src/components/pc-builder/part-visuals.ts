import { normalizeFormFactor } from "@solusation/shared-types";
import type { BuildSelection, SelectedComponent } from "@/stores/pc-builder-store";

/**
 * Turns database products into the numbers the 3D scene draws, so that a part
 * looks like what it is. Scene units are 100 mm: an ATX board is 3.05 x 2.44.
 */

export type BoardSize = "ATX" | "MATX" | "ITX";

const BOARD_DIMENSIONS: Record<BoardSize, { width: number; height: number }> = {
  ATX: { width: 2.44, height: 3.05 },
  MATX: { width: 2.44, height: 2.44 },
  ITX: { width: 1.7, height: 1.7 },
};

const CASE_HEIGHT: Record<BoardSize, number> = { ATX: 4.7, MATX: 4.0, ITX: 3.3 };

export const CASE_REAR_X = -2.3;
export const CASE_FRONT_X = 2.3;
export const CASE_DEPTH_Z = 1.1;
export const SHROUD_TOP_Y = 0.95;
export const BOARD_Z = -0.9;

export interface SceneLayout {
  caseHeight: number;
  caseSize: BoardSize;
  board: { size: BoardSize; left: number; top: number; width: number; height: number };
  socket: [number, number];
  ramX: number;
  ramY: number;
  ramSlots: number;
  pcieY: number;
  m2: [number, number];
}

export function boardSizeOf(part?: SelectedComponent): BoardSize {
  const size = normalizeFormFactor(part?.specs.formFactor);
  if (size) return size;
  // Boards named like "B650M" are Micro-ATX even when no form factor was entered.
  if (part && /\b[A-Z]\d{3}M\b/i.test(part.name)) return "MATX";
  return "ATX";
}

export function buildLayout(selected: BuildSelection): SceneLayout {
  const caseSize = selected.CASE ? boardSizeOf(selected.CASE) : "ATX";
  const size = boardSizeOf(selected.MOBO);
  const caseHeight = CASE_HEIGHT[caseSize];
  const { width, height } = BOARD_DIMENSIONS[size];
  const left = CASE_REAR_X + 0.18;
  const top = caseHeight - 0.2;
  const compact = size === "ITX";

  return {
    caseHeight,
    caseSize,
    board: { size, left, top, width, height },
    socket: [left + (compact ? 0.72 : 1.05), top - (compact ? 0.68 : 0.95)],
    ramX: left + (compact ? 1.38 : 1.82),
    ramY: top - (compact ? 0.72 : 0.82),
    ramSlots: compact ? 2 : 4,
    pcieY: top - (compact ? 1.42 : 1.9),
    m2: [left + (compact ? 0.45 : 1.25), top - (compact ? 1.2 : 1.6)],
  };
}

export interface CaseVisual {
  isLight: boolean;
}

export function caseVisual(part: SelectedComponent): CaseVisual {
  return { isLight: /white|snow|frost|arctic/i.test(part.name) };
}

export interface GpuVisual {
  fans: 2 | 3;
  length: number;
  label: string;
}

export function gpuVisual(part: SelectedComponent): GpuVisual {
  const tdp = part.specs.tdpWatts ?? 0;
  const isLarge = tdp >= 180 || /\b(3x|trio|strix|tuf|gaming x)\b/i.test(part.name);
  const label = part.name.match(/\b(?:RTX|GTX|RX|ARC)\s*[A-Z]?\d{3,4}\s*(?:TI SUPER|TI|SUPER|XTX|XT)?/i)?.[0];
  return {
    fans: isLarge ? 3 : 2,
    length: isLarge ? 3.05 : 2.35,
    label: (label ?? part.brand ?? "GRAPHICS").trim().toUpperCase(),
  };
}

export interface RamVisual {
  sticks: number;
  isRgb: boolean;
}

export function ramVisual(part: SelectedComponent): RamVisual {
  const kit = part.name.match(/\b([1-4])\s*x\s*\d+\s*GB/i);
  const sticks = kit ? Number(kit[1]) : 2;
  return { sticks, isRgb: /\brgb\b/i.test(part.name) };
}

export interface CoolerVisual {
  kind: "air" | "liquid";
}

export function coolerVisual(part: SelectedComponent): CoolerVisual {
  return { kind: /\b(aio|liquid|water|240|280|360)\b/i.test(part.name) ? "liquid" : "air" };
}

export interface StorageVisual {
  kind: "m2" | "drive";
}

export function storageVisual(part: SelectedComponent): StorageVisual {
  const isDrive = /\b(hdd|hard disk|sata|2\.5|3\.5)\b/i.test(part.name) && !/\b(nvme|m\.2)\b/i.test(part.name);
  return { kind: isDrive ? "drive" : "m2" };
}

export function cpuLabel(part: SelectedComponent): string {
  const match = part.name.match(/\b(?:Ryzen\s*\d\s*\w+|Core\s*(?:i\d|Ultra\s*\d)[-\s]*\w+|Xeon\s*\w+|Athlon\s*\w+)/i);
  return (match?.[0] ?? part.brand ?? "CPU").toUpperCase();
}
