import { useMutation } from "@tanstack/react-query";
import api from "@src/config/axios";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from "@src/features/auth/types/auth.types";
import { useAuthStore } from "@src/store/authStore";

// ─── Login ────────────────────────────────────────────────────
export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await api.post<AuthResponse>("/auth/user/login", data);
      return res.data;
    },
    onSuccess: async (data) => {
      try {
        const token = data.data.token;
        if (token) {
          const res = await api.get("/addresses", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const addresses = res.data?.data;
          if (addresses && addresses.length > 0) {
            const defaultAddr =
              addresses.find((a: any) => a.isDefault) || addresses[0];
            const { useLocationStore } = require("@src/store/locationStore");
            await useLocationStore.getState().setDefaultAddress(defaultAddr);
          }
        }
      } catch (err) {
        console.log("Failed to restore address in mutation:", err);
      }

      // Call setAuth LAST so that ProtectedRoute doesn't unmount the Login component prematurely
      await setAuth(data.data.token, data.data.user);
    },
  });
};

// ─── Register ─────────────────────────────────────────────────
export const useRegister = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const res = await api.post<AuthResponse>("/auth/user/register", data);
      return res.data;
    },
    onSuccess: async (data) => {
      await setAuth(data.data.token, data.data.user);
    },
  });
};

// ─── Logout ───────────────────────────────────────────────────
export const useLogout = () => {
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSuccess: async () => {
      await logout();
    },
    onError: async () => {
      // Force logout even if API call fails
      await logout();
    },
  });
};
