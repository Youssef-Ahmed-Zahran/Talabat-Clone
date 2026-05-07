export interface Store {
  id: string | number;
  name: string;
  nameAr?: string;
  logoUrl?: string;
  coverImage?: string;
  coverUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  categoryId?: number;
  mainCategory?: { id: string | number; name: string };
  averageRating?: number | string;
  isActive: boolean;
  isOpen?: boolean;
  deliveryFee?: number;
  minOrder?: number;
  estimatedDeliveryTime?: string;
  
  // Advanced fields
  description?: string;
  legalName?: string;
  storeType?: string;
  deliveryType?: 'TALABAT_DELIVERY' | 'STORE_DELIVERY';
  openTime?: string;
  closeTime?: string;
  deliveryTimeMinutes?: number;
  minimumOrderCost?: number | string;
  deliveryFees?: number | string;
  allowPreorder?: boolean;
  latitude?: string;
  longitude?: string;
  
  createdAt: string;
  updatedAt?: string;
  storeZones?: {
    id: string;
    storeId: string;
    zoneId: string;
    zone: { id: string; name: string };
  }[];
}

export interface CreateStorePayload {
  name: string;
  description?: string;
  legalName?: string;
  phone?: string;
  email?: string;
  address?: string;
  mainCategoryId: string | number;
  storeType: string;
  deliveryType: 'TALABAT_DELIVERY' | 'STORE_DELIVERY';
  openTime: string;
  closeTime: string;
  deliveryTimeMinutes: number;
  minimumOrderCost: number;
  deliveryFees: number;
  allowPreorder: boolean;
  latitude: string;
  longitude: string;
  cityName: string;
  governorateName?: string;
  countryName: string;
  countryCode: string;
  logo?: string;
  cover?: string;
  ownerEmail: string;
  ownerPassword?: string;
  /** Explicitly assign store to a zone on creation (overrides spatial detection) */
  zoneId?: string;
}

export type UpdateStorePayload = Partial<CreateStorePayload>;

export interface FetchStoresOptions {
  mainCategoryId?: string;
  subCategoryId?: string;
}

