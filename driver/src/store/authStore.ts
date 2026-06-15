import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthDriver } from '@src/features/auth/types/auth.types';

interface AuthState {
  token: string | null;
  driver: AuthDriver | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (token: string, driver: AuthDriver) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
  updateDriver: (driverData: Partial<AuthDriver>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  driver: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (token, driver) => {
    await AsyncStorage.setItem('driver_token', token);
    await AsyncStorage.setItem('driver_user', JSON.stringify(driver));
    set({ token, driver, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await AsyncStorage.removeItem('driver_token');
    await AsyncStorage.removeItem('driver_user');
    // Reset online status in UIStore
    const { useUIStore } = await import('./uiStore');
    useUIStore.getState().setOnline(false);
    set({ token: null, driver: null, isAuthenticated: false, isLoading: false });
  },

  updateDriver: async (driverData) => {
    set((state) => {
      if (!state.driver) return {};
      const updated = { ...state.driver, ...driverData };
      AsyncStorage.setItem('driver_user', JSON.stringify(updated)).catch(() => {});
      return { driver: updated };
    });
  },

  loadAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const driverStr = await AsyncStorage.getItem('driver_user');
      if (token && driverStr) {
        const driver = JSON.parse(driverStr) as AuthDriver;
        set({ token, driver, isAuthenticated: true, isLoading: false });

        // Sync online status from persisted driver data
        // Import lazily to avoid circular dependency
        const { useUIStore } = await import('./uiStore');
        useUIStore.getState().setOnline(driver.isOnline ?? false);
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
