import { useEffect } from "react";
import type { GeoJSONPolygon } from "../../../types";

interface UseZoneGeocodingOptions {
  name: string;
  cityId: string;
  cities: { id: string; name: string }[];
  mode: "create" | "edit";
  showNameSuggestions: boolean;
  setNameSuggestions: (
    v: { name?: string; display_name: string; lat: string; lon: string }[]
  ) => void;
  setIsSearchingName: (v: boolean) => void;
  setMapCenter: (v: [number, number] | null) => void;
}

export function useZoneGeocoding({
  name,
  cityId,
  cities,
  mode,
  showNameSuggestions,
  setNameSuggestions,
  setIsSearchingName,
  setMapCenter,
}: UseZoneGeocodingOptions) {
  useEffect(() => {
    if (!name.trim() || mode === "edit" || !showNameSuggestions) {
      const t = setTimeout(() => setNameSuggestions([]), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(async () => {
      setIsSearchingName(true);
      try {
        const selectedCityName = cities.find((c) => c.id === cityId)?.name || "";
        const query = [name, selectedCityName, "Egypt"].filter(Boolean).join(", ");
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`,
        );
        const data = await res.json();
        setNameSuggestions(data || []);
        if (data?.length > 0) {
          setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch (err) {
        console.error("Geocoding failed:", err);
        setNameSuggestions([]);
      } finally {
        setIsSearchingName(false);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [name, cityId, cities, mode, showNameSuggestions]);
}

// Unused export kept for type compatibility
export type { GeoJSONPolygon };
