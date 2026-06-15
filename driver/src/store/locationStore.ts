import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocationState {
  // Current GPS position (updated in real-time)
  currentLatitude: number | null;
  currentLongitude: number | null;
  currentHeading: number | null;

  // Whether location permissions granted
  hasLocationPermission: boolean;
  isLocationLoading: boolean;

  setCurrentPosition: (lat: number, lng: number, heading?: number) => void;
  setLocationPermission: (granted: boolean) => Promise<void>;
  loadLocationPermission: () => Promise<void>;
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLatitude: null,
  currentLongitude: null,
  currentHeading: null,
  hasLocationPermission: false,
  isLocationLoading: true,

  setCurrentPosition: (lat, lng, heading = 0) => {
    set({
      currentLatitude: lat,
      currentLongitude: lng,
      currentHeading: heading,
    });
  },

  setLocationPermission: async (granted) => {
    await AsyncStorage.setItem('driver_location_permission', granted ? 'true' : 'false');
    set({ hasLocationPermission: granted, isLocationLoading: false });
  },

  loadLocationPermission: async () => {
    try {
      const value = await AsyncStorage.getItem('driver_location_permission');
      set({
        hasLocationPermission: value === 'true',
        isLocationLoading: false,
      });
    } catch {
      set({ isLocationLoading: false });
    }
  },
}));
