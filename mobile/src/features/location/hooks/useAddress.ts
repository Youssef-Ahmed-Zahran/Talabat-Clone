import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCreateAddress } from "@src/features/account/sub-features/address/api/address.api";
import { useLocationStore } from "@src/store/locationStore";
import { getErrorMessage } from "@src/utils/error";
import type { AddressType } from "@src/features/location/types/address.types";

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
    params: { latitude: string; longitude: string; countryCode: string; countryName: string; cityName?: string };
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

export function useAddress(): UseAddressReturn {
  const router = useRouter();
  const params = useLocalSearchParams<{
    latitude: string;
    longitude: string;
    countryCode: string;
    countryName: string;
    cityName?: string;
  }>();

  const setDefaultAddress = useLocationStore((s) => s.setDefaultAddress);
  const createAddress = useCreateAddress();

  const [cityName, setCityName] = useState(params.cityName || "");
  const [type, setType] = useState<AddressType>("APARTMENT");
  const [label, setLabel] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [apartmentNumber, setApartmentNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [street, setStreet] = useState("");
  const [phone, setPhone] = useState("");

  const navigateBack = useCallback(() => router.back(), [router]);

  const handleSave = useCallback(() => {
    if (!cityName.trim()) {
      Alert.alert("Error", "Please enter your city name");
      return;
    }
    if (!params.countryName || !params.countryCode) {
      Alert.alert(
        "Error",
        "Country information missing. Please go back and select your country.",
      );
      return;
    }
    createAddress.mutate(
      {
        cityName: cityName.trim(),
        countryName: params.countryName,
        countryCode: params.countryCode,
        type,
        label: label || undefined,
        buildingName: buildingName || undefined,
        apartmentNumber: apartmentNumber || undefined,
        floor: floor || undefined,
        street: street || undefined,
        phone: phone || undefined,
        latitude: parseFloat(params.latitude || "0"),
        longitude: parseFloat(params.longitude || "0"),
        isDefault: true,
      },
      {
        onSuccess: async (addr) => {
          await setDefaultAddress(addr);
          router.replace("/(tabs)/home");
        },
        onError: (err) => Alert.alert("Error", getErrorMessage(err)),
      },
    );
  }, [
    cityName,
    params,
    type,
    label,
    buildingName,
    apartmentNumber,
    floor,
    street,
    phone,
    createAddress,
    setDefaultAddress,
    router,
  ]);

  return {
    form: {
      cityName,
      setCityName,
      type,
      setType,
      label,
      setLabel,
      buildingName,
      setBuildingName,
      apartmentNumber,
      setApartmentNumber,
      floor,
      setFloor,
      street,
      setStreet,
      phone,
      setPhone,
    },
    query: {
      params,
    },
    state: {
      isPending: createAddress.isPending,
    },
    actions: {
      handleSave,
    },
    router: {
      navigateBack,
    },
  };
}
