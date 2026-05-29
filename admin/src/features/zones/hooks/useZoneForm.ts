import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  fetchZoneById,
  fetchCities,
  type GeoJSONPolygon,
  type Zone,
} from "../api/zones.api";
import toast from "react-hot-toast";

type Mode = "create" | "edit";

export function useZoneForm() {
  const { id } = useParams<{ id?: string }>();
  const mode: Mode = id ? "edit" : "create";

  const [name, setName] = useState("");
  const [cityId, setCityId] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#F97316");
  const [geojson, setGeojson] = useState<GeoJSONPolygon | null>(null);
  const [initialPolygon, setInitialPolygon] = useState<GeoJSONPolygon | null>(null);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const selectedCountryCode = "EG";

  // Name suggestions for geocoding
  const [nameSuggestions, setNameSuggestions] = useState<
    { name?: string; display_name: string; lat: string; lon: string }[]
  >([]);
  const [isSearchingName, setIsSearchingName] = useState(false);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

  // Load cities on mount
  useEffect(() => {
    fetchCities(selectedCountryCode).then(setCities).catch(() => {});
  }, []);

  return {
    mode,
    id,
    name,
    setName,
    cityId,
    setCityId,
    description,
    setDescription,
    color,
    setColor,
    geojson,
    setGeojson,
    initialPolygon,
    setInitialPolygon,
    cities,
    nameSuggestions,
    setNameSuggestions,
    isSearchingName,
    setIsSearchingName,
    showNameSuggestions,
    setShowNameSuggestions,
  };
}

export function useZoneLoader(
  mode: "create" | "edit",
  id: string | undefined,
  setName: (v: string) => void,
  setCityId: (v: string) => void,
  setDescription: (v: string) => void,
  setColor: (v: string) => void,
  setInitialPolygon: (v: GeoJSONPolygon | null) => void,
  setGeojson: (v: GeoJSONPolygon | null) => void,
  setAssignedStores: (v: Zone["storeZones"]) => void,
  setAssignedDrivers: (v: Zone["driverZones"]) => void,
) {
  useEffect(() => {
    if (mode === "edit" && id) {
      fetchZoneById(id)
        .then((zone) => {
          console.log("[ZoneEditor] Loaded zone data:", zone);
          setName(zone.name || "");
          setCityId(zone.cityId || "");
          setDescription(zone.description || "");
          setColor(zone.color || "#F97316");
          if (zone.boundary) {
            setInitialPolygon(zone.boundary);
            setGeojson(zone.boundary);
          }
          setAssignedStores(zone.storeZones || []);
          setAssignedDrivers(zone.driverZones || []);
        })
        .catch((err) => {
          console.error("[ZoneEditor] Failed to fetch zone:", err);
          toast.error("Failed to load zone details. Please refresh.");
        });
    }
  }, [mode, id]);
}
