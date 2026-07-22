// ============================================================
// Store Types
// ============================================================

export type DeliveryType =
  | "TALABAT"
  | "STORE"
  | "TALABAT_DELIVERY"
  | "STORE_DELIVERY";

export interface Store {
  id: string;
  mainCategoryId: string;
  mainCategory?: { id: string; name: string };
  cityId: string;
  name: string;
  description: string | null;
  phone: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  storeType: string;
  deliveryType: DeliveryType;
  openTime: string | null;
  closeTime: string | null;
  overtimeOpenTime?: string | null;
  overtimeCloseTime?: string | null;
  deliveryTimeMinutes: number | null;
  minimumOrderCost: number;
  deliveryFees: number;
  latitude: number;
  longitude: number;
  averageRating: number;
  totalReviews: number;
  isActive: boolean;
}

export interface MainCategory {
  id: string;
  name: string;
  imageUrl: string | null;
}

export interface SubCategory {
  id: string;
  mainCategoryId: string;
  name: string;
  imageUrl: string | null;
}

export interface StoreSection {
  id: string;
  storeId: string;
  name: string;
  sortOrder: number;
  products: Product[];
}

export interface Product {
  id: string;
  sectionId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  images?: string[];
  isAvailable: boolean;
  sortOrder: number;
  optionGroups?: OptionGroup[];
  meta?: Record<string, unknown>;
}

export interface OptionGroup {
  id: string;
  productId: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  values: OptionValue[];
}

export interface OptionValue {
  id: string;
  optionGroupId: string;
  name: string;
  extraPrice: number;
}
