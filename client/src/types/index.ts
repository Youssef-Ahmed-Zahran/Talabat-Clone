export * from "./common";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Category {
  id: string;
  name: string;
  image?: string;
  imageUrl?: string;
  parentId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export * from "./store";
export type { Order, OrderItem, OrderStatus } from "./order";
export * from "./dashboard";
export * from "./catalog";
