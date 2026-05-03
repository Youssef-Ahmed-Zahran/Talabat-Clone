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
export type { User } from "./user";
export type { Driver, DriverStatus } from "./driver";
export * from "./dashboard";
export * from "./category_payloads";
export * from "./catalog";
