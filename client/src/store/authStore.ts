import { create } from "zustand";
import api from "../config/axios";

interface AuthState {
  role: "owner" | null;
  storeId: string | null;
  setAuth: (storeId: string) => void;
  logout: () => void;
}

const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

export const useAuthStore = create<AuthState>((set) => ({
  role: getCookie("storeId") ? "owner" : null,
  storeId: getCookie("storeId"),

  setAuth: (storeId: string) => {
    // Only storing the non-sensitive metadata in JS cookies.
    // The actual authentication token is an HttpOnly cookie managed by the browser.
    document.cookie = `storeId=${storeId}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    set({ role: "owner", storeId });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore
    }
    document.cookie = "storeId=; path=/; max-age=0";
    set({ role: null, storeId: null });
  },
}));
