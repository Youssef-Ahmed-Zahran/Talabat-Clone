export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'WAITING_FOR_DRIVER'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  options?: string;
}

export interface Order {
  id: number;
  userId: number;
  user?: { id: string | number; fullName: string; email: string };
  storeId: string | number;
  store?: { id: string | number; name: string };
  driverId?: string | number | null;
  driver?: { id: string | number; name: string } | null;
  delivery?: {
    driverId?: string | null;
    driver?: {
      id: string;
      phone?: string;
      application?: { firstName?: string; familyName?: string };
    } | null;
  } | null;
  status: OrderStatus;
  totalAmount: number | string;
  deliveryFee?: number | string;
  address: string;
  items?: OrderItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
