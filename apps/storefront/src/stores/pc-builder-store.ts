import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  CompatibilityCheckResult,
  CompatibilitySpecs,
  SelectedBuildComponents,
  validatePcBuildCompatibility,
} from "@solusation/shared-types";

export const BUILDER_SLOTS = [
  "CASE",
  "MOBO",
  "CPU",
  "COOLER",
  "RAM",
  "GPU",
  "STORAGE",
  "PSU",
  "MONITOR",
] as const;

export type BuilderSlot = (typeof BUILDER_SLOTS)[number];

export interface SelectedComponent {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string | null;
  cashPriceBdt: number;
  regularPriceBdt: number;
  thumbnailUrl: string;
  specs: CompatibilitySpecs;
}

export type BuildSelection = Partial<Record<BuilderSlot, SelectedComponent>>;

/** Runs the shared compatibility rules on any selection, chosen or hypothetical. */
export function checkBuild(selected: BuildSelection): CompatibilityCheckResult {
  const toBuildPart = (part: SelectedComponent) => ({ name: part.name, specs: part.specs });
  const build: SelectedBuildComponents = {};

  for (const slot of BUILDER_SLOTS) {
    const part = selected[slot];
    if (!part) continue;
    if (slot === "STORAGE") build.STORAGE = [toBuildPart(part)];
    else build[slot] = toBuildPart(part);
  }

  return validatePcBuildCompatibility(build);
}

interface PcBuilderState {
  selected: BuildSelection;
  selectComponent: (slot: BuilderSlot, part: SelectedComponent) => void;
  removeComponent: (slot: BuilderSlot) => void;
  setBuild: (selected: BuildSelection) => void;
  clearBuild: () => void;
}

export const usePcBuilderStore = create<PcBuilderState>()(
  persist(
    (set) => ({
      selected: {},
      selectComponent: (slot, part) =>
        set((state) => ({ selected: { ...state.selected, [slot]: part } })),
      removeComponent: (slot) =>
        set((state) => {
          const selected = { ...state.selected };
          delete selected[slot];
          return { selected };
        }),
      setBuild: (selected) => set({ selected }),
      clearBuild: () => set({ selected: {} }),
    }),
    {
      name: "solutions-pc-build",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selected: state.selected }),
      // Rehydrated from an effect, so the server and first client render match.
      skipHydration: true,
    }
  )
);
