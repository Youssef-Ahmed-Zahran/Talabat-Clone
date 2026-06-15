// ============================================================
// Onboarding Types
// ============================================================

export type VehicleType = 'CAR' | 'MOTORCYCLE' | 'BICYCLE';
export type ShirtSize = 'MEDIUM' | 'LARGE' | 'XL';
export type DocumentType =
  | 'ID_FRONT'
  | 'ID_BACK'
  | 'LICENSE_FRONT'
  | 'LICENSE_BACK'
  | 'VEHICLE_LICENSE_FRONT'
  | 'VEHICLE_LICENSE_BACK'
  | 'CRIMINAL_RECORD'
  | 'SELFIE';

export interface PersonalInfoPayload {
  vehicleType: VehicleType;
  firstName: string;
  familyName: string;
  phone: string;
  secondPhone?: string;
  isOver18: boolean;
  gender?: string;
  nationality?: string;
  nationalId?: string;
  dateOfBirth?: string;
  idNumber?: string;
  idExpiryDate?: string;
  residenceGovernorate?: string;
  shirtSize?: ShirtSize;
  interestedInTobacco?: boolean;
}

export interface VehicleInfoPayload {
  vehiclePlateNumber?: string;
  drivingLicenseExpiry?: string;
  vehicleRegistrationExpiry?: string;
}

export interface DocumentUpload {
  documentType: DocumentType;
  file: string; // base64 data URI
}

export interface ApplicationStatus {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  vehicleType?: VehicleType | null;
  firstName?: string | null;
  familyName?: string | null;
}
