// ============================================================
// User Types
// ============================================================

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
