import { useMutation } from '@tanstack/react-query';
import api from '@config/axios';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@features/auth/types/auth.types';
import { useAuthStore } from '@store/authStore';
import { useUIStore } from '@store/uiStore';

// ─── Register ─────────────────────────────────────────────────
export const useRegisterApi = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setOnline = useUIStore((s) => s.setOnline);

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const res = await api.post<AuthResponse>('/auth/driver/register', data);
      return res.data;
    },
    onSuccess: async (data) => {
      await setAuth(data.data.token, data.data.driver);
      setOnline(data.data.driver.isOnline ?? false);
    },
  });
};

// ─── Login ────────────────────────────────────────────────────
export const useLoginApi = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setOnline = useUIStore((s) => s.setOnline);

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await api.post<AuthResponse>('/auth/driver/login', data);
      return res.data;
    },
    onSuccess: async (data) => {
      await setAuth(data.data.token, data.data.driver);
      setOnline(data.data.driver.isOnline ?? false);
    },
  });
};

// ─── Logout ───────────────────────────────────────────────────
export const useLogoutApi = () => {
  const logout = useAuthStore((s) => s.logout);
  const setOnline = useUIStore((s) => s.setOnline);

  return useMutation({
    mutationFn: async () => {
      try {
        await api.post('/auth/logout');
      } catch {
        // Silently fail — logout from client anyway
      }
    },
    onSuccess: async () => {
      setOnline(false);
      await logout();
    },
    onError: async () => {
      setOnline(false);
      await logout();
    },
  });
};
