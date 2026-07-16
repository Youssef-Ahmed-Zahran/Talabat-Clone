// ============================================================
// Dispatch payload — from the dispatch:new_order socket event
// Kept here (separate from deliveries.types.ts) because it is
// imported by uiStore and useDispatchListener outside the feature.
// ============================================================

export interface DispatchPayload {
  order: {
    id: string;
    subtotal: number;
    deliveryFees: number;
    tipAmount: number;
    totalAmount: number;
    deliveryInstructions: string | null;
    createdAt: string;
    customerName: string;
    customerPhone: string | null;
  };
  store: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  userAddress: {
    latitude: number;
    longitude: number;
    street: string | null;
  };
  assignment: {
    id: string;
    status: string;
    assignedAt: string;
  };
  distanceToStoreKm: string | null;
}
