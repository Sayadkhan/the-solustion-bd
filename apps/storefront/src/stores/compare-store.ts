import { create } from "zustand";

export interface CompareProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categorySlug: string;
  cashPriceBdt: number;
  regularPriceBdt: number;
  thumbnailUrl: string;
  brand: string;
  specs?: {
    socket?: string | null;
    supportedRam?: string | null;
    tdpWatts?: number;
    benchmarkScore?: number;
    formFactor?: string | null;
  };
}

interface CompareState {
  items: CompareProduct[];
  selected: CompareProduct[];
  addItem: (item: CompareProduct) => boolean;
  addComponent: (item: CompareProduct) => boolean;
  removeItem: (id: string) => void;
  removeComponent: (id: string) => void;
  clear: () => void;
  clearAll: () => void;
  isSelected: (id: string) => boolean;
}

export const useCompareStore = create<CompareState>((set, get) => ({
  items: [],
  get selected() {
    return get().items;
  },
  addItem: (item) => {
    const current = get().items;
    if (current.find((i) => i.id === item.id)) return false;
    if (current.length >= 4) {
      alert("You can compare up to 4 products at a time.");
      return false;
    }
    const updated = [...current, item];
    set({ items: updated });
    return true;
  },
  addComponent: (item) => get().addItem(item),
  removeItem: (id) => {
    const updated = get().items.filter((i) => i.id !== id);
    set({ items: updated });
  },
  removeComponent: (id) => get().removeItem(id),
  clear: () => set({ items: [] }),
  clearAll: () => set({ items: [] }),
  isSelected: (id) => get().items.some((i) => i.id === id),
}));
