import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserAddress } from '@src/features/location/types/address.types';

interface LocationState {
  selectedLatitude: number | null;
  selectedLongitude: number | null;
  selectedCityId: string | null;
  selectedCountryCode: string | null;
  selectedCountryName: string | null;
  defaultAddress: UserAddress | null;
  hasLocation: boolean;
  isLocationLoading: boolean;

  setMapLocation: (lat: number, lng: number) => Promise<void>;
  setCity: (cityId: string) => Promise<void>;
  setCountry: (code: string, name?: string) => Promise<void>;
  setDefaultAddress: (address: UserAddress) => Promise<void>;
  clearLocation: () => Promise<void>;
  loadLocation: () => Promise<void>;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  selectedLatitude: null,
  selectedLongitude: null,
  selectedCityId: null,
  selectedCountryCode: null,
  selectedCountryName: null,
  defaultAddress: null,
  hasLocation: false,
  isLocationLoading: true,

  setMapLocation: async (lat, lng) => {
    set({ selectedLatitude: lat, selectedLongitude: lng });
    await AsyncStorage.setItem('location_state', JSON.stringify(get()));
  },

  setCity: async (cityId) => {
    set({ selectedCityId: cityId });
    await AsyncStorage.setItem('location_state', JSON.stringify(get()));
  },

  setCountry: async (code, name) => {
    set({ selectedCountryCode: code, selectedCountryName: name ?? null });
    await AsyncStorage.setItem('location_state', JSON.stringify(get()));
  },

  setDefaultAddress: async (address) => {
    set({
      defaultAddress: address,
      hasLocation: true,
      selectedLatitude: address.latitude,
      selectedLongitude: address.longitude,
      selectedCityId: address.cityId,
    });
    await AsyncStorage.setItem('location_state', JSON.stringify(get()));
  },

  clearLocation: async () => {
    await AsyncStorage.removeItem('location_state');
    set({
      selectedLatitude: null,
      selectedLongitude: null,
      selectedCityId: null,
      selectedCountryCode: null,
      selectedCountryName: null,
      defaultAddress: null,
      hasLocation: false,
    });
  },

  loadLocation: async () => {
    try {
      const stateStr = await AsyncStorage.getItem('location_state');
      if (stateStr) {
        const state = JSON.parse(stateStr);
        set({
          selectedLatitude: state.selectedLatitude ?? null,
          selectedLongitude: state.selectedLongitude ?? null,
          selectedCityId: state.selectedCityId ?? null,
          selectedCountryCode: state.selectedCountryCode ?? null,
          selectedCountryName: state.selectedCountryName ?? null,
          defaultAddress: state.defaultAddress ?? null,
          hasLocation: state.hasLocation ?? false,
          isLocationLoading: false,
        });
      } else {
        set({ isLocationLoading: false });
      }
    } catch {
      set({ isLocationLoading: false });
    }
  },
}));
