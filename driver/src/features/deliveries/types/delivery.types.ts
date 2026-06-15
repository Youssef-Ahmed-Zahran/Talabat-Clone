// ============================================================
// Delivery / Order Types (Driver perspective)
// ============================================================

export type DeliveryStatus =
  | 'pending'
  | 'accepted'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

export interface DeliveryItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface Delivery {
  id: string;
  orderId: string;
  status: DeliveryStatus;
  customer: {
    id: string;
    fullName: string;
    phone: string | null;
  };
  store: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  deliveryAddress: DeliveryAddress;
  items: DeliveryItem[];
  totalAmount: number;
  deliveryFee: number;
  estimatedMinutes: number | null;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface IncomingOrder {
  id: string;
  orderId: string;
  storeName: string;
  storeAddress: string;
  deliveryAddress: string;
  totalAmount: number;
  deliveryFee: number;
  estimatedDistance: number;
  estimatedMinutes: number;
}
