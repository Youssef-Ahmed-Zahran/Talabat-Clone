// ============================================================
// Tracking Types
// ============================================================

export interface TrackingData {
  orderId: string;
  status: string;
  driverLatitude: number | null;
  driverLongitude: number | null;
  estimatedArrival: string | null;
  storeLatitude: number;
  storeLongitude: number;
  deliveryLatitude: number;
  deliveryLongitude: number;
  driver?: {
    id: string;
    phone: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  order?: {
    id: string;
    status: string;
    store: {
      name: string;
      latitude: number;
      longitude: number;
    };
    address: {
      latitude: number;
      longitude: number;
      label: string | null;
    };
  };
}

export interface DriverLocationUpdate {
  driverId: string;
  orderId: string;
  latitude: number;
  longitude: number;
}
