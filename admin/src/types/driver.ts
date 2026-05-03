export type DriverStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export interface DriverDocument {
  id: string;
  driverId: string;
  documentType: string;
  fileUrl: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  rejectionReason?: string;
  createdAt: string;
}

export interface Driver {
  id: string | number;
  email: string;
  phone?: string;
  status: "ONLINE" | "OFFLINE" | "ON_DELIVERY" | "SUSPENDED";
  isOnline: boolean;
  latitude?: number;
  longitude?: number;
  application?: {
    status: DriverStatus;
    firstName: string;
    familyName: string;
    vehicleType: string;
    phone: string;
    nationalId?: string;
    dateOfBirth?: string;
    vehiclePlateNumber?: string;
    governorate?: { name: string };
  };
  documents?: DriverDocument[];
  city?: {
    name: string;
    country?: { name: string };
  };
  _count?: {
    deliveries: number;
    earnings: number;
  };
  rating?: number | string;
  createdAt: string;
  updatedAt?: string;
}
