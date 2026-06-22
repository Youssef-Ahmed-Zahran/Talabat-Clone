// ============================================================
// Order Types
// ============================================================

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "WAITING_FOR_DRIVER"
  | "PICKED_UP"
  | "ON_THE_WAY"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type PaymentMethodType = "CASH" | "CARD" | "PAYPAL";

// Snapshot of a single item as returned by order history
export interface OrderItem {
  name_snapshot: string;
  price_snapshot: number;
  quantity: number;
  options?: {
    option_name_snapshot: string;
    option_value_snapshot: string;
    extra_price_snapshot: number;
  }[];
}

export interface Order {
  id: string;
  userId: string;
  storeId: string;
  addressId: string;
  status: OrderStatus;
  paymentMethodId: string;
  subtotal: number;
  deliveryFees: number;
  tipAmount: number;
  totalAmount: number;
  deliveryType: string;
  deliveryInstructions: string | null;
  scheduledTime: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  store?: {
    id: string;
    name: string;
    logoUrl: string | null;
    latitude?: string | null;
    longitude?: string | null;
    maxDeliveryDistanceKm?: number | null;
  };
  address?: {
    id: string;
    label: string | null;
    street: string | null;
  };
  liveTracking?: LiveTracking | null;
  // Populated by getMyOrders from the tenant database
  items?: OrderItem[];
}

export interface PlaceOrderRequest {
  storeId: string;
  addressId: string;
  paymentMethodId: string;
  deliveryInstructions?: string;
  tipAmount?: number;
  scheduledTime?: string;
}

export interface PaymentMethod {
  id: string;
  name: PaymentMethodType;
}

export type LiveTrackingStatus =
  | "WAITING_FOR_DRIVER"
  | "DRIVER_ASSIGNED"
  | "DRIVER_HEADING_TO_STORE"
  | "DRIVER_AT_STORE"
  | "DRIVER_HEADING_TO_CUSTOMER"
  | "DELIVERED";

export interface LiveTracking {
  id: string;
  orderId: string;
  driverId: string | null;
  status: LiveTrackingStatus;
  driverLatitude: number | null;
  driverLongitude: number | null;
  estimatedArrival: string | null;
  driver?: {
    id: string;
    phone: string | null;
  };
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  changedByType: string;
  note: string | null;
  createdAt: string;
}

// ============================================================
// UI & Hook Types
// ============================================================

export interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  storeId: string;
  orderId: string;
  storeName: string;
}

export interface UseOrderHistoryReturn {
  query: {
    orders: Order[] | undefined;
    isLoading: boolean;
  };
  state: {
    refreshing: boolean;
    reorderingId: string | null;
    selectedReviewOrder: Order | null;
  };
  actions: {
    onRefresh: () => Promise<void>;
    handleReorder: (orderId: string, storeId: string) => void;
    handleTrack: (orderId: string) => void;
    handleReview: (order: Order) => void;
    closeReviewModal: () => void;
  };
  router: {
    navigateHome: () => void;
  };
}

export interface UseReviewModalProps {
  storeId: string;
  orderId: string;
  onClose: () => void;
}

export interface UseOrderDetailReturn {
  query: {
    order: Order | undefined;
    isLoading: boolean;
  };
  router: {
    goBack: () => void;
  };
}

export interface OrderCardProps {
  item: Order;
  isReordering: boolean;
  onTrack: () => void;
  onReorder: () => void;
  onReview: () => void;
}
