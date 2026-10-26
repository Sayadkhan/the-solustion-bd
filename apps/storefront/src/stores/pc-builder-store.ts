import { create } from "zustand";
import {
  ComponentType,
  CompatibilitySpecs,
  validatePcBuildCompatibility,
  CompatibilityCheckResult,
} from "@solusation/shared-types";

export interface SelectedComponent {
  id: string;
  name: string;
  sku: string;
  cashPriceBdt: number;
  regularPriceBdt: number;
  thumbnailUrl: string;
  specs: CompatibilitySpecs;
}

interface PcBuilderState {
  selected: Partial<Record<ComponentType, SelectedComponent>>;
  compatibilityResult: CompatibilityCheckResult;
  selectComponent: (type: ComponentType, item: SelectedComponent) => void;
  removeComponent: (type: ComponentType) => void;
  clearBuild: () => void;
  getTotalCashPriceBdt: () => number;
  getTotalRegularPriceBdt: () => number;
}

export const usePcBuilderStore = create<PcBuilderState>((set, get) => ({
  selected: {},
  compatibilityResult: {
    isCompatible: true,
    totalEstimatedTdpWatts: 50,
    recommendedPsuWattage: 450,
    errors: [],
    warnings: ["Start picking components to simulate your dream build."],
  },
  selectComponent: (type, item) => {
    set((state) => {
      const nextSelected = { ...state.selected, [type]: item };
      const compResult = validatePcBuildCompatibility({
        CPU: nextSelected.CPU ? { name: nextSelected.CPU.name, specs: nextSelected.CPU.specs } : undefined,
        MOBO: nextSelected.MOBO ? { name: nextSelected.MOBO.name, specs: nextSelected.MOBO.specs } : undefined,
        RAM: nextSelected.RAM ? { name: nextSelected.RAM.name, specs: nextSelected.RAM.specs } : undefined,
        GPU: nextSelected.GPU ? { name: nextSelected.GPU.name, specs: nextSelected.GPU.specs } : undefined,
        PSU: nextSelected.PSU ? { name: nextSelected.PSU.name, specs: nextSelected.PSU.specs } : undefined,
        CASE: nextSelected.CASE ? { name: nextSelected.CASE.name, specs: nextSelected.CASE.specs } : undefined,
      });

      return {
        selected: nextSelected,
        compatibilityResult: compResult,
      };
    });
  },
  removeComponent: (type) => {
    set((state) => {
      const nextSelected = { ...state.selected };
      delete nextSelected[type];
      const compResult = validatePcBuildCompatibility({
        CPU: nextSelected.CPU ? { name: nextSelected.CPU.name, specs: nextSelected.CPU.specs } : undefined,
        MOBO: nextSelected.MOBO ? { name: nextSelected.MOBO.name, specs: nextSelected.MOBO.specs } : undefined,
        RAM: nextSelected.RAM ? { name: nextSelected.RAM.name, specs: nextSelected.RAM.specs } : undefined,
        GPU: nextSelected.GPU ? { name: nextSelected.GPU.name, specs: nextSelected.GPU.specs } : undefined,
        PSU: nextSelected.PSU ? { name: nextSelected.PSU.name, specs: nextSelected.PSU.specs } : undefined,
        CASE: nextSelected.CASE ? { name: nextSelected.CASE.name, specs: nextSelected.CASE.specs } : undefined,
      });

      return {
        selected: nextSelected,
        compatibilityResult: compResult,
      };
    });
  },
  clearBuild: () => {
    set({
      selected: {},
      compatibilityResult: {
        isCompatible: true,
        totalEstimatedTdpWatts: 50,
        recommendedPsuWattage: 450,
        errors: [],
        warnings: ["Start picking components to simulate your dream build."],
      },
    });
  },
  getTotalCashPriceBdt: () => {
    return Object.values(get().selected).reduce(
      (acc, item) => acc + (item?.cashPriceBdt || 0),
      0
    );
  },
  getTotalRegularPriceBdt: () => {
    return Object.values(get().selected).reduce(
      (acc, item) => acc + (item?.regularPriceBdt || 0),
      0
    );
  },
}));
