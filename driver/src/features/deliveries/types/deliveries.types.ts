// ─── Type matching the real API response from /drivers/orders/active ───────────
export interface ActiveDeliveryOrder {
  id: string;
  orderId: string;
  status: 'ACCEPTED';
  order: {
    id: string;
    status: string;
    subtotal: number;
    deliveryFees: number;
    tipAmount: number;
    totalAmount: number;
    deliveryInstructions: string | null;
    createdAt: string;
    user: { fullName: string; phone: string | null };
    store: {
      id: string;
      name: string;
      logoUrl: string | null;
      latitude: number | string;
      longitude: number | string;
    };
    address: {
      latitude: number | string;
      longitude: number | string;
      street: string | null;
      buildingName: string | null;
      floor: string | null;
      apartmentNumber: string | null;
    };
    liveTracking: {
      status: string;
      driverLatitude: number | string | null;
      driverLongitude: number | string | null;
      estimatedArrival: string | null;
    } | null;
  };
}

// Pending assignment from the server (dispatch:new_order or REST)
export interface PendingAssignment {
  id: string;
  orderId: string;
  status: 'PENDING';
  assignedAt: string;
  order: {
    id: string;
    subtotal: number;
    deliveryFees: number;
    tipAmount: number;
    totalAmount: number;
    deliveryInstructions: string | null;
    createdAt: string;
    user: { fullName: string; phone: string | null };
    store: {
      id: string;
      name: string;
      logoUrl: string | null;
      latitude: number | string;
      longitude: number | string;
      deliveryTimeMinutes: number | null;
    };
    address: {
      latitude: number | string;
      longitude: number | string;
      street: string | null;
      buildingName: string | null;
      floor: string | null;
      apartmentNumber: string | null;
    };
  };
}

export type DeliveryStatus =
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED';
