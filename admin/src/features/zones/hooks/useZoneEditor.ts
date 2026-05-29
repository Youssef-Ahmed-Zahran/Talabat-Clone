import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateZone, useUpdateZone } from "../api/zones.api";
import { useZoneForm, useZoneLoader } from "./useZoneForm";
import { useZoneStores } from "./useZoneStores";
import { useZoneDrivers } from "./useZoneDrivers";
import { useZoneGeocoding } from "./useZoneGeocoding";
import toast from "react-hot-toast";

export function useZoneEditor() {
  const navigate = useNavigate();
  const createZoneMutation = useCreateZone();
  const updateZoneMutation = useUpdateZone();

  // UI state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"map" | "stores" | "drivers">("map");
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  // Sub-hooks
  const form = useZoneForm();
  const stores = useZoneStores(form.id);
  const drivers = useZoneDrivers(form.id);

  // Geocoding for zone name search
  useZoneGeocoding({
    name: form.name,
    cityId: form.cityId,
    cities: form.cities,
    mode: form.mode,
    showNameSuggestions: form.showNameSuggestions,
    setNameSuggestions: form.setNameSuggestions,
    setIsSearchingName: form.setIsSearchingName,
    setMapCenter,
  });

  // Load existing zone data in edit mode
  useZoneLoader(
    form.mode,
    form.id,
    form.setName,
    form.setCityId,
    form.setDescription,
    form.setColor,
    form.setInitialPolygon,
    form.setGeojson,
    stores.setAssignedStores,
    drivers.setAssignedDrivers,
  );

  const handleSelectNameSuggestion = (suggestion: {
    name?: string;
    display_name: string;
    lat: string;
    lon: string;
  }) => {
    const shortName = suggestion.name || suggestion.display_name.split(",")[0];
    form.setName(shortName);
    form.setShowNameSuggestions(false);
    if (suggestion.lat && suggestion.lon) {
      setMapCenter([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.cityId) {
      setSaveError("Name and city are required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (form.mode === "create") {
        if (!form.geojson) {
          setSaveError("Please draw a zone polygon on the map.");
          setSaving(false);
          return;
        }
        const newZone = await createZoneMutation.mutateAsync({
          name: form.name,
          cityId: form.cityId,
          description: form.description,
          color: form.color,
          geojson: form.geojson,
        });
        toast.success("Zone created successfully.");
        navigate(`/zones/${newZone.id}/edit`);
      } else if (form.id) {
        await updateZoneMutation.mutateAsync({
          id: form.id,
          name: form.name,
          description: form.description,
          color: form.color,
          ...(form.geojson ? { geojson: form.geojson } : {}),
        });
        toast.success("Zone updated successfully.");
        navigate("/zones");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setSaveError(error?.response?.data?.message || "Failed to save zone.");
    } finally {
      setSaving(false);
    }
  };

  return {
    state: {
      form: {
        mode: form.mode,
        id: form.id,
        name: form.name,
        setName: form.setName,
        cityId: form.cityId,
        setCityId: form.setCityId,
        description: form.description,
        setDescription: form.setDescription,
        color: form.color,
        setColor: form.setColor,
        geojson: form.geojson,
        setGeojson: form.setGeojson,
        initialPolygon: form.initialPolygon,
        cities: form.cities,
      },
      geocoding: {
        nameSuggestions: form.nameSuggestions,
        isSearchingName: form.isSearchingName,
        showNameSuggestions: form.showNameSuggestions,
        setShowNameSuggestions: form.setShowNameSuggestions,
      },
      stores: {
        assignedStores: stores.assignedStores,
        storeSearch: stores.storeSearch,
        setStoreSearch: stores.setStoreSearch,
        storeResults: stores.storeResults,
        searchingStores: stores.searchingStores,
      },
      drivers: {
        assignedDrivers: drivers.assignedDrivers,
        driverSearch: drivers.driverSearch,
        setDriverSearch: drivers.setDriverSearch,
        driverResults: drivers.driverResults,
        searchingDrivers: drivers.searchingDrivers,
      },
      ui: {
        saving,
        saveError,
        activeTab,
        setActiveTab,
        mapCenter,
        setMapCenter,
      },
    },
    actions: {
      handleSelectNameSuggestion,
      handleAddStore: stores.handleAddStore,
      handleRemoveStore: stores.handleRemoveStore,
      handleAddDriver: drivers.handleAddDriver,
      handleRemoveDriver: drivers.handleRemoveDriver,
      handleSave,
    },
    router: {
      navigate,
    },
  };
}

