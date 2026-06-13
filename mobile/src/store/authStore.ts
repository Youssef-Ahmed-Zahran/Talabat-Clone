import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser } from '@src/features/auth/types/auth.types';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
  updateUser: (userData: Partial<AuthUser>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (token, user) => {
    await AsyncStorage.setItem('user_token', token);
    await AsyncStorage.setItem('user_data', JSON.stringify(user));
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await AsyncStorage.removeItem('user_token');
    await AsyncStorage.removeItem('user_data');
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  updateUser: async (userData) => {
    set((state) => {
      if (!state.user) return {};
      const updated = { ...state.user, ...userData };
      AsyncStorage.setItem('user_data', JSON.stringify(updated)).catch(() => {});
      return { user: updated };
    });
  },

  loadAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      const userStr = await AsyncStorage.getItem('user_data');
      if (token && userStr) {
        const user = JSON.parse(userStr) as AuthUser;
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
