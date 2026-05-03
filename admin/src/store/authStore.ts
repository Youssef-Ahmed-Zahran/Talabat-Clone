import { create } from "zustand";

interface AuthState {
  token: string | null;
  role: "admin" | "owner" | null;
  storeId: string | null;
  setToken: (token: string, role: "admin" | "owner", storeId?: string) => void;
  logout: () => void;
}

const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: getCookie("adminToken"),
  role: (getCookie("userRole") as "admin" | "owner" | null) || "admin",
  storeId: getCookie("storeId"),

  setToken: (token: string, role: "admin" | "owner", storeId?: string) => {
    document.cookie = `adminToken=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    document.cookie = `userRole=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    if (storeId) {
      document.cookie = `storeId=${storeId}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    }
    set({ token, role, storeId: storeId || null });
  },

  logout: () => {
    document.cookie = "adminToken=; path=/; max-age=0";
    document.cookie = "userRole=; path=/; max-age=0";
    document.cookie = "storeId=; path=/; max-age=0";
    set({ token: null, role: null, storeId: null });
  },
}));
