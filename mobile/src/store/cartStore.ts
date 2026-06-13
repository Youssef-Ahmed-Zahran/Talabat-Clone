import { create } from 'zustand';
import type { CartItem } from '@src/features/cart/types/cart.types';

interface CartState {
  // Cart badge count for tab bar
  itemCount: number;
  storeId: string | null;
  cartId: string | null;
  items: CartItem[];

  setCart: (cartId: string, storeId: string, items: CartItem[]) => void;
  setItemCount: (count: number) => void;
  addItemLocally: (item: CartItem) => void;
  removeItemLocally: (itemId: string) => void;
  updateQuantityLocally: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  itemCount: 0,
  storeId: null,
  cartId: null,
  items: [],

  setCart: (cartId, storeId, items) => {
    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
    set({ cartId, storeId, items, itemCount: totalCount });
  },

  setItemCount: (count) => {
    set({ itemCount: count });
  },

  addItemLocally: (item) => {
    const { items } = get();
    const newItems = [...items, item];
    const totalCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
    set({ items: newItems, itemCount: totalCount });
  },

  removeItemLocally: (itemId) => {
    const { items } = get();
    const newItems = items.filter((i) => i.id !== itemId);
    const totalCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
    set({ items: newItems, itemCount: totalCount });
  },

  updateQuantityLocally: (itemId, quantity) => {
    const { items } = get();
    const newItems = items.map((i) =>
      i.id === itemId ? { ...i, quantity } : i
    );
    const totalCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
    set({ items: newItems, itemCount: totalCount });
  },

  clearCart: () => {
    set({ itemCount: 0, storeId: null, cartId: null, items: [] });
  },
}));
