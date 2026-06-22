import { Ionicons } from "@expo/vector-icons";
export type IconName = keyof typeof Ionicons.glyphMap;
// ============================================================
// Auth Types
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: AuthUser;
  };
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

export interface AuthFormInputProps {
  label: string;
  icon: IconName;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
  autoCapitalize?: any;
  autoCorrect?: boolean;
  secureTextEntry?: boolean;
  rightElement?: React.ReactNode;
}

export interface UseLoginReturn {
  form: {
    email: string;
    password: string;
    setEmail: (v: string) => void;
    setPassword: (v: string) => void;
  };
  state: {
    showPassword: boolean;
    isPending: boolean;
    toggleShowPassword: () => void;
  };
  actions: {
    handleLogin: () => void;
  };
  router: {
    navigateToRegister: () => void;
  };
}

export interface UseRegisterReturn {
  form: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    setFullName: (v: string) => void;
    setEmail: (v: string) => void;
    setPhone: (v: string) => void;
    setPassword: (v: string) => void;
    setConfirmPassword: (v: string) => void;
  };
  state: {
    showPassword: boolean;
    isPending: boolean;
    toggleShowPassword: () => void;
  };
  actions: {
    handleRegister: () => void;
  };
  router: {
    navigateToLogin: () => void;
  };
}
