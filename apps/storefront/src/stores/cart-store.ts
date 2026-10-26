import { create } from "zustand";

export interface CartItem {
  id: string;
  productId?: string;
  name: string;
  sku: string;
  slug?: string;
  cashPriceBdt: number;
  regularPriceBdt: number;
  selectedPriceType?: "CASH_PRICE" | "REGULAR_PRICE" | "CASH" | "REGULAR";
  pricingType?: "CASH" | "REGULAR";
  thumbnailUrl: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Partial<CartItem> & { name: string; sku: string; cashPriceBdt: number; regularPriceBdt: number; thumbnailUrl: string; id?: string; productId?: string }, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalCashBdt: () => number;
  getTotalRegularBdt: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item, quantity = 1) => {
    const itemId = item.id || item.productId || `item-${Date.now()}`;
    const formattedItem: CartItem = {
      id: itemId,
      productId: itemId,
      name: item.name,
      sku: item.sku,
      slug: item.slug || itemId,
      cashPriceBdt: item.cashPriceBdt,
      regularPriceBdt: item.regularPriceBdt,
      selectedPriceType: item.selectedPriceType || "CASH_PRICE",
      pricingType: item.pricingType || "CASH",
      thumbnailUrl: item.thumbnailUrl,
      quantity,
    };

    set((state) => {
      const existing = state.items.find((i) => i.id === itemId || i.productId === itemId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === itemId || i.productId === itemId ? { ...i, quantity: i.quantity + quantity } : i
          ),
        };
      }
      return { items: [...state.items, formattedItem] };
    });
  },
  removeItem: (id) => {
    set((state) => ({ items: state.items.filter((i) => i.id !== id && i.productId !== id) }));
  },
  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    set((state) => ({
      items: state.items.map((i) => (i.id === id || i.productId === id ? { ...i, quantity } : i)),
    }));
  },
  clearCart: () => set({ items: [] }),
  getTotalCashBdt: () => {
    return get().items.reduce((acc, i) => acc + i.cashPriceBdt * i.quantity, 0);
  },
  getTotalRegularBdt: () => {
    return get().items.reduce((acc, i) => acc + i.regularPriceBdt * i.quantity, 0);
  },
  getItemCount: () => {
    return get().items.reduce((acc, i) => acc + i.quantity, 0);
  },
}));
