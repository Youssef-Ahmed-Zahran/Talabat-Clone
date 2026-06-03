export interface Zone {
  id: string;
  name: string;
  cityId: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  city?: { id: string; name: string };
  _count?: { storeZones: number; driverZones: number };
  boundary?: GeoJSONPolygon | null;
  storeZones?: {
    id: string;
    storeId: string;
    zoneId: string;
    store: { id: string; name: string; logoUrl?: string; isActive: boolean };
  }[];
  driverZones?: {
    id: string;
    driverId: string;
    zoneId: string;
    driver: {
      id: string;
      phone: string;
      isOnline: boolean;
      status: string;
      application?: { firstName: string; familyName: string; profilePhotoUrl?: string } | null;
    };
  }[];
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

export interface ZoneStore {
  id: string;
  name: string;
  logoUrl?: string;
  isActive: boolean;
  city?: { name: string };
}

export interface ZonesListResponse {
  zones: Zone[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
