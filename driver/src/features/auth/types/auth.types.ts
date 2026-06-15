// ============================================================
// Driver Auth Types
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  phone?: string;
  cityName: string;
  governorateName?: string;
  countryName: string;
  countryCode: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    driver: AuthDriver;
  };
}

export interface AuthDriver {
  id: string;
  email: string;
  phone: string | null;
  isOnline: boolean;
  status: string;              // OFFLINE | ONLINE | ON_DELIVERY | SUSPENDED
  createdAt: string;
  // From DriverApplication (null until submitted)
  applicationStatus: string | null;  // PENDING | APPROVED | REJECTED | null
  vehicleType: string | null;
  vehiclePlateNumber: string | null;
  firstName: string | null;
  familyName: string | null;
  fullName?: string | null;   // convenience field — may be populated by the API
}
