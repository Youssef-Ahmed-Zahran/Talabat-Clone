import { useState, useEffect, useCallback, useRef } from "react";
import { Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import MapView, { Region } from "react-native-maps";
import * as Location from "expo-location";
import { useLocationStore } from "@src/store/locationStore";
import { UseMapPickingReturn } from "../types/location.types";

const COUNTRY_CENTERS: Record<string, { lat: number; lng: number }> = {
  EG: { lat: 30.0444, lng: 31.2357 },
  SA: { lat: 24.7136, lng: 46.6753 },
  AE: { lat: 25.2048, lng: 55.2708 },
  KW: { lat: 29.3759, lng: 47.9774 },
  QA: { lat: 25.2854, lng: 51.531 },
  BH: { lat: 26.2235, lng: 50.5876 },
  JO: { lat: 31.9454, lng: 35.9284 },
  LB: { lat: 33.8938, lng: 35.5018 },
  IQ: { lat: 33.3152, lng: 44.3661 },
  OM: { lat: 23.61, lng: 58.5922 },
};
export function useMapPicking(): UseMapPickingReturn {
  const router = useRouter();
  const { countryCode, countryName } = useLocalSearchParams<{
    countryCode: string;
    countryName: string;
  }>();
  const setMapLocation = useLocationStore((s) => s.setMapLocation);
  const mapRef = useRef<MapView>(null);

  const center = countryCode
    ? (COUNTRY_CENTERS[countryCode] ?? COUNTRY_CENTERS["EG"])
    : COUNTRY_CENTERS["EG"];

  const [region, setRegion] = useState<Region>({
    latitude: center.lat,
    longitude: center.lng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [selected, setSelected] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [address, setAddress] = useState("");
  const [cityName, setCityName] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Animate to country center on mount — no auto GPS
  useEffect(() => {
    const r = {
      latitude: center.lat,
      longitude: center.lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    setRegion(r);
    setTimeout(() => mapRef.current?.animateToRegion(r, 800), 300);
  }, []);

  const updateAddress = useCallback(async (lat: number, lng: number) => {
    setAddressLoading(true);
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      if (results.length > 0) {
        const r = results[0];
        const parts = [r.street, r.district, r.city, r.region].filter(Boolean);
        setAddress(parts.join(", "));
        setCityName(r.city || r.subregion || r.region || "");
      }
    } catch {
      setAddress("");
      setCityName("");
    } finally {
      setAddressLoading(false);
    }
  }, []);

  const handleMapPress = useCallback(
    (e: any) => {
      const coordinate = e.nativeEvent?.coordinate;
      if (!coordinate) return;
      const { latitude, longitude } = coordinate;
      setSelected({ latitude, longitude });
      updateAddress(latitude, longitude);
    },
    [updateAddress],
  );

  const requestLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please enable location permissions in settings.",
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = loc.coords;
      const r = {
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setRegion(r);
      setSelected({ latitude, longitude });
      mapRef.current?.animateToRegion(r, 800);
      updateAddress(latitude, longitude);
    } catch {
      Alert.alert(
        "Error",
        "Could not fetch your current location. Please try again.",
      );
    } finally {
      setLocationLoading(false);
    }
  }, [updateAddress]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    try {
      const fullQuery = countryName
        ? `${searchQuery.trim()}, ${countryName}`
        : searchQuery.trim();
      const results = await Location.geocodeAsync(fullQuery);
      if (results.length > 0) {
        const r = {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setRegion(r);
        setSelected({ latitude: r.latitude, longitude: r.longitude });
        mapRef.current?.animateToRegion(r, 800);
        updateAddress(r.latitude, r.longitude);
      } else {
        Alert.alert(
          "Not Found",
          "No results for that search. Try a street or area name.",
        );
      }
    } catch {
      Alert.alert("Error", "Search failed. Please try again.");
    }
  }, [searchQuery, countryName, updateAddress]);

  const handleConfirm = useCallback(() => {
    if (!selected) {
      Alert.alert(
        "Select Location",
        "Tap on the map to pin your delivery point first.",
      );
      return;
    }
    setMapLocation(selected.latitude, selected.longitude);
    router.push({
      pathname: "/location/address",
      params: {
        latitude: String(selected.latitude),
        longitude: String(selected.longitude),
        countryCode: countryCode || "",
        countryName: countryName || "",
        cityName: cityName,
      },
    });
  }, [selected, setMapLocation, router, countryCode, countryName, cityName]);

  return {
    query: {
      countryCode: countryCode || "",
      countryName: countryName || "",
    },
    state: {
      region,
      selected,
      address,
      addressLoading,
      locationLoading,
      searchQuery,
      setSearchQuery,
    },
    actions: {
      handleMapPress,
      handleSearch,
      handleConfirm,
      requestLocation,
    },
    refs: {
      mapRef,
    },
  };
}
