import { create } from "zustand";
import api from "../config/axios";

interface AuthState {
  role: "admin" | "owner" | null;
  storeId: string | null;
  setAuth: (role: "admin" | "owner") => void;
  logout: () => void;
}

const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

export const useAuthStore = create<AuthState>((set) => ({
  role: getCookie("userRole") as "admin" | "owner" | null,
  storeId: null,

  setAuth: (role: "admin" | "owner") => {
    document.cookie = `userRole=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    set({ role, storeId: null });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore
    }
    document.cookie = "userRole=; path=/; max-age=0";
    set({ role: null, storeId: null });
  },
}));
