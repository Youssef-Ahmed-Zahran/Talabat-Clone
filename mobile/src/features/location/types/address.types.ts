// ============================================================
// Address Types
// ============================================================

export type AddressType = 'APARTMENT' | 'VILLA' | 'OFFICE';

export interface UserAddress {
  id: string;
  userId: string;
  cityId: string;
  type: AddressType;
  label: string | null;
  buildingName: string | null;
  apartmentNumber: string | null;
  floor: string | null;
  street: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: string;
  city?: {
    id: string;
    name: string;
  };
}

export interface CreateAddressRequest {
  cityName: string;
  countryName: string;
  countryCode: string;
  governorateName?: string;
  type: AddressType;
  label?: string;
  buildingName?: string;
  apartmentNumber?: string;
  floor?: string;
  street?: string;
  phone?: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

export interface UpdateAddressRequest extends Partial<CreateAddressRequest> {}
