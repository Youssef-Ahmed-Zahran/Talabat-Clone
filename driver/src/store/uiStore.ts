import { create } from 'zustand';
import type { DispatchPayload } from '@features/deliveries/types/delivery.types';

// Driver-specific order status types
export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

interface UIState {
  // Global loading overlay
  isGlobalLoading: boolean;
  setGlobalLoading: (v: boolean) => void;

  // Active delivery order (shows banner on home)
  activeOrderId: string | null;
  activeOrderStatus: OrderStatus | null;
  setActiveOrder: (orderId: string | null, status?: OrderStatus | null) => void;
  clearActiveOrder: () => void;

  // Driver online/offline toggle
  isOnline: boolean;
  setOnline: (v: boolean) => void;

  // New order incoming bottom sheet + the dispatch payload
  isIncomingOrderSheetOpen: boolean;
  setIncomingOrderSheetOpen: (v: boolean) => void;
  incomingOrder: DispatchPayload | null;
  setIncomingOrder: (order: DispatchPayload | null) => void;

  // Chat sheet
  isChatSheetOpen: boolean;
  setChatSheetOpen: (v: boolean) => void;
  chatOrderId: string | null;
  setChatOrderId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isGlobalLoading: false,
  setGlobalLoading: (v) => set({ isGlobalLoading: v }),

  activeOrderId: null,
  activeOrderStatus: null,
  setActiveOrder: (orderId, status = null) =>
    set({ activeOrderId: orderId, activeOrderStatus: status }),
  clearActiveOrder: () => set({ activeOrderId: null, activeOrderStatus: null }),

  isOnline: false,
  setOnline: (v) => set({ isOnline: v }),

  isIncomingOrderSheetOpen: false,
  setIncomingOrderSheetOpen: (v) => set({ isIncomingOrderSheetOpen: v }),
  incomingOrder: null,
  setIncomingOrder: (order) => set({ incomingOrder: order }),

  isChatSheetOpen: false,
  setChatSheetOpen: (v) => set({ isChatSheetOpen: v }),
  chatOrderId: null,
  setChatOrderId: (id) => set({ chatOrderId: id }),
}));
