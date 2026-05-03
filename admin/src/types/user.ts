export interface User {
  id: string | number;
  fullName: string;
  email: string;
  phone?: string;
  image?: string;
  isBlocked: boolean;
  totalOrders?: number;
  createdAt: string;
  updatedAt?: string;
}
