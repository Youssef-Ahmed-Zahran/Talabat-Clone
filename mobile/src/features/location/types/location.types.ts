import { AddressType } from "./address.types";
import { Country, Region } from "./geography.types";
import MapView from "react-native-maps";
// location Types
export interface UseAddressReturn {
  form: {
    cityName: string;
    setCityName: (v: string) => void;
    type: AddressType;
    setType: (v: AddressType) => void;
    label: string;
    setLabel: (v: string) => void;
    buildingName: string;
    setBuildingName: (v: string) => void;
    apartmentNumber: string;
    setApartmentNumber: (v: string) => void;
    floor: string;
    setFloor: (v: string) => void;
    street: string;
    setStreet: (v: string) => void;
    phone: string;
    setPhone: (v: string) => void;
  };
  query: {
    params: {
      latitude: string;
      longitude: string;
      countryCode: string;
      countryName: string;
      cityName?: string;
    };
  };
  state: {
    isPending: boolean;
  };
  actions: {
    handleSave: () => void;
  };
  router: {
    navigateBack: () => void;
  };
}

export interface UseCountrySelectionReturn {
  query: {
    countries: Country[] | undefined;
    isLoading: boolean;
  };
  actions: {
    handleSelectCountry: (country: Country) => Promise<void>;
  };
}

export interface UseMapPickingReturn {
  query: {
    countryCode: string;
    countryName: string;
  };
  state: {
    region: Region;
    selected: { latitude: number; longitude: number } | null;
    address: string;
    addressLoading: boolean;
    locationLoading: boolean;
    searchQuery: string;
    setSearchQuery: (v: string) => void;
  };
  actions: {
    handleMapPress: (e: any) => void;
    handleSearch: () => Promise<void>;
    handleConfirm: () => void;
    requestLocation: () => Promise<void>;
  };
  refs: {
    mapRef: React.RefObject<MapView | null>;
  };
}
