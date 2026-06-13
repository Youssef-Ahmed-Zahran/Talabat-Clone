import { create } from 'zustand';

interface UIState {
  // Global loading overlay
  isGlobalLoading: boolean;
  setGlobalLoading: (v: boolean) => void;

  // Active order tracking (shows banner on home)
  activeOrderId: string | null;
  activeOrderStatus: string | null;
  setActiveOrder: (orderId: string | null, status?: string | null) => void;

  // Bottom sheet states
  isCartSheetOpen: boolean;
  setCartSheetOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isGlobalLoading: false,
  setGlobalLoading: (v) => set({ isGlobalLoading: v }),

  activeOrderId: null,
  activeOrderStatus: null,
  setActiveOrder: (orderId, status = null) =>
    set({ activeOrderId: orderId, activeOrderStatus: status }),

  isCartSheetOpen: false,
  setCartSheetOpen: (v) => set({ isCartSheetOpen: v }),
}));
