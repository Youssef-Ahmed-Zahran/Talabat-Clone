import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  createZone,
  updateZone,
  fetchZoneById,
  assignStoresToZone,
  removeStoreFromZone,
  assignDriversToZone,
  removeDriverFromZone,
  fetchStores,
  fetchDrivers,
  fetchCities,
  fetchCountries,
  type GeoJSONPolygon,
  type Zone,
  type ZoneDriver,
} from "../api/zones.api";
import ZoneMapEditor from "../components/ZoneMapEditor";
import {
  MapPin,
  Save,
  ArrowLeft,
  Search,
  X,
  Plus,
  Building2,
  Car,
  ChevronRight,
  Info,
  Loader2,
  AlertTriangle,
} from "lucide-react";

const CITY_COORDINATES: Record<string, [number, number]> = {
  cairo: [30.0444, 31.2357],
  alexandria: [31.2001, 29.9187],
  giza: [30.0131, 31.2089],
  "port said": [31.2565, 32.2841],
  suez: [29.9668, 32.5498],
  luxor: [25.6872, 32.6396],
  aswan: [24.0889, 32.8998],
  tanta: [30.7865, 31.0004],
  asyut: [27.181, 31.1837],
  ismailia: [30.5965, 32.2715],
  faiyum: [29.3084, 30.8428],
  zagazig: [30.5877, 31.502],
  damietta: [31.4175, 31.8144],
  mansoura: [31.0409, 31.3785],
  hurghada: [27.2579, 33.8116],
  minya: [28.1099, 30.7503],
  "beni suef": [29.0661, 31.0994],
  qena: [26.1551, 32.716],
  sohag: [26.557, 31.6948],
  "shibin el kom": [30.5503, 31.0106],
  "shubra el kheima": [30.1286, 31.2422],
};

type Mode = "create" | "edit";

const ZoneEditorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const mode: Mode = id ? "edit" : "create";

  // Form state
  const [name, setName] = useState("");
  const [cityId, setCityId] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#F97316");
  const [geojson, setGeojson] = useState<GeoJSONPolygon | null>(null);
  const [initialPolygon, setInitialPolygon] = useState<GeoJSONPolygon | null>(
    null,
  );

  // Cities & Countries
  const [countries, setCountries] = useState<
    { id: string; name: string; code: string }[]
  >([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState("EG");

  // Store assignment
  const [assignedStores, setAssignedStores] = useState<Zone["storeZones"]>([]);
  const [storeSearch, setStoreSearch] = useState("");
  const [storeResults, setStoreResults] = useState<any[]>([]);
  const [searchingStores, setSearchingStores] = useState(false);

  // UI
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"map" | "stores" | "drivers">(
    "map",
  );
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  // Driver assignment
  const [assignedDrivers, setAssignedDrivers] = useState<any[]>([]);
  const [driverSearch, setDriverSearch] = useState("");
  const [driverResults, setDriverResults] = useState<ZoneDriver[]>([]);
  const [searchingDrivers, setSearchingDrivers] = useState(false);

  // Load countries on mount — then auto-select the first one to trigger city load
  useEffect(() => {
    fetchCountries()
      .then((list) => {
        setCountries(list);
        if (list.length > 0) {
          setSelectedCountryCode(list[0].code);
        }
      })
      .catch(() => {});
  }, []);

  // Load cities when country changes
  useEffect(() => {
    fetchCities(selectedCountryCode)
      .then(setCities)
      .catch(() => {});
  }, [selectedCountryCode]);

  // Load existing zone for edit mode
  useEffect(() => {
    if (mode === "edit" && id) {
      fetchZoneById(id)
        .then((zone) => {
          console.log("[ZoneEditor] Loaded zone data:", zone);
          console.log("[ZoneEditor] StoreZones count:", zone.storeZones?.length || 0);
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

  // Auto-pan map when Zone Name is typed (debounced geocoding)
  useEffect(() => {
    if (!name.trim() || mode === "edit") return;
    const timer = setTimeout(async () => {
      try {
        const selectedCityName =
          cities.find((c) => c.id === cityId)?.name || "";
        const selectedCountryName =
          countries.find((c) => c.code === selectedCountryCode)?.name || "";

        const parts = [name, selectedCityName, selectedCountryName].filter(
          Boolean,
        );
        const query = parts.join(", ");

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        );
        const data = await res.json();

        if (data && data.length > 0) {
          setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch (err) {
        console.error("Geocoding failed:", err);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [name, cityId, selectedCountryCode, cities, countries, mode]);

  // Store search
  useEffect(() => {
    if (!storeSearch.trim()) {
      setStoreResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingStores(true);
      try {
        const stores = await fetchStores(storeSearch);
        setStoreResults(stores);
      } catch {
        setStoreResults([]);
      } finally {
        setSearchingStores(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [storeSearch]);

  const handleAddStore = async (store: any) => {
    if (!id) return;
    try {
      await assignStoresToZone(id, [store.id]);
      setAssignedStores((prev) => [
        ...(prev || []),
        { id: Math.random().toString(), storeId: store.id, store } as any,
      ]);
      setStoreSearch("");
      setStoreResults([]);
    } catch {
      alert("Failed to assign store.");
    }
  };

  const handleRemoveStore = async (storeId: string) => {
    if (!id) return;
    try {
      await removeStoreFromZone(id, storeId);
      setAssignedStores((prev) =>
        (prev || []).filter(
          (s: any) => s.storeId !== storeId && s.store?.id !== storeId,
        ),
      );
    } catch {
      alert("Failed to remove store.");
    }
  };

  // Driver search
  useEffect(() => {
    if (!driverSearch.trim()) {
      setDriverResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingDrivers(true);
      try {
        const drivers = await fetchDrivers(driverSearch);
        setDriverResults(drivers);
      } catch {
        setDriverResults([]);
      } finally {
        setSearchingDrivers(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [driverSearch]);

  const handleAddDriver = async (driver: ZoneDriver) => {
    if (!id) return;
    try {
      await assignDriversToZone(id, [driver.id]);
      setAssignedDrivers((prev) => [
        ...prev,
        { id: Math.random().toString(), driverId: driver.id, driver } as any,
      ]);
      setDriverSearch("");
      setDriverResults([]);
    } catch {
      alert("Failed to assign driver.");
    }
  };

  const handleRemoveDriver = async (driverId: string) => {
    if (!id) return;
    try {
      await removeDriverFromZone(id, driverId);
      setAssignedDrivers((prev) =>
        prev.filter(
          (d: any) => d.driverId !== driverId && d.driver?.id !== driverId,
        ),
      );
    } catch {
      alert("Failed to remove driver.");
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !cityId) {
      setSaveError("Name and city are required.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      if (mode === "create") {
        if (!geojson) {
          setSaveError("Please draw a zone polygon on the map.");
          setSaving(false);
          return;
        }
        const newZone = await createZone({
          name,
          cityId,
          description,
          color,
          geojson,
        });
        navigate(`/zones/${newZone.id}/edit`);
      } else if (id) {
        await updateZone(id, {
          name,
          description,
          color,
          ...(geojson ? { geojson } : {}),
        });
        navigate("/zones");
      }
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || "Failed to save zone.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 animate-fade-in pb-12">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/zones")}
            className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand">
              <MapPin size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                {mode === "create" ? "Create Zone" : "Edit Zone"}
              </h1>
              <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
                {mode === "create"
                  ? "Delivery Area Definition"
                  : `ID: ${id?.slice(0, 8)}…`}
              </p>
            </div>
          </div>
        </div>

        <button
          className="inline-flex items-center gap-2.5 px-6 py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-dark transition-all shadow-sm shadow-brand/20 active:scale-[0.98] disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {saving ? "Saving Changes…" : "Save Zone"}
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 lg:p-8">
        {saveError && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 animate-slide-up">
            <AlertTriangle size={18} />
            <p className="text-sm font-semibold">{saveError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center gap-2 text-gray-900 mb-2">
                <Info size={16} className="text-brand" />
                <h2 className="text-lg font-bold">Zone Configuration</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-gray-700 ml-1">
                    Zone Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Maadi Residential Area"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-gray-900 font-medium placeholder:text-gray-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-gray-700 ml-1">
                      Country
                    </label>
                    <select
                      value={selectedCountryCode}
                      onChange={(e) => {
                        setSelectedCountryCode(e.target.value);
                        setCityId("");
                      }}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-gray-900 font-medium appearance-none"
                    >
                      {countries.length === 0 && (
                        <option value="">Loading…</option>
                      )}
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-gray-700 ml-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={cityId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setCityId(id);
                        const selectedCity = cities.find((c) => c.id === id);
                        if (selectedCity) {
                          const coords =
                            CITY_COORDINATES[selectedCity.name.toLowerCase()];
                          if (coords) setMapCenter(coords);
                        }
                      }}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-gray-900 font-medium appearance-none"
                    >
                      <option value="">— Select city —</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-gray-700 ml-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional notes about delivery constraints or specific instructions…"
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-gray-900 font-medium placeholder:text-gray-300 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-gray-700 ml-1">
                    Map Visualization Color
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer overflow-hidden"
                    />
                    <span className="text-sm font-mono font-bold text-gray-600">
                      {color.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`p-6 rounded-3xl border flex items-center gap-4 transition-all ${geojson ? "bg-green-50 border-green-100 text-green-700" : "bg-brand/5 border-brand/10 text-brand"}`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${geojson ? "bg-green-100" : "bg-brand/10"}`}
              >
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">
                  {geojson ? "Polygon Defined" : "Action Required"}
                </p>
                <p className="text-xs opacity-80">
                  {geojson
                    ? "Area successfully mapped"
                    : "Draw the zone boundary on the map"}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Map + Stores tabs */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[650px]">
            <div className="flex border-b border-gray-100 bg-gray-50/50 p-1.5 gap-1">
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === "map" ? "bg-white text-brand shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-white/50"}`}
                onClick={() => setActiveTab("map")}
              >
                <MapPin size={16} /> Map View
              </button>
              {mode === "edit" && (
                <>
                  <button
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === "stores" ? "bg-white text-brand shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-white/50"}`}
                    onClick={() => setActiveTab("stores")}
                  >
                    <Building2 size={16} /> Stores (
                    {(assignedStores as any[])?.length ?? 0})
                  </button>
                  <button
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === "drivers" ? "bg-white text-brand shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-white/50"}`}
                    onClick={() => setActiveTab("drivers")}
                  >
                    <Car size={16} /> Drivers ({assignedDrivers?.length ?? 0})
                  </button>
                </>
              )}
            </div>

            <div className="flex-1 relative flex flex-col">
              {activeTab === "map" && (
                <div className="absolute inset-0">
                  <ZoneMapEditor
                    initialPolygon={initialPolygon}
                    onChange={setGeojson}
                    height="100%"
                    centerOn={mapCenter}
                  />
                </div>
              )}

              {(activeTab === "stores" || activeTab === "drivers") && (
                <div className="p-6 flex flex-col h-full bg-gray-50/30 overflow-y-auto">
                  {/* Search Bar */}
                  <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={
                        activeTab === "stores"
                          ? "Search stores by name…"
                          : "Search drivers by name or phone…"
                      }
                      value={
                        activeTab === "stores" ? storeSearch : driverSearch
                      }
                      onChange={(e) =>
                        activeTab === "stores"
                          ? setStoreSearch(e.target.value)
                          : setDriverSearch(e.target.value)
                      }
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm font-medium shadow-sm"
                    />
                    {(searchingStores || searchingDrivers) && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2
                          size={16}
                          className="text-brand animate-spin"
                        />
                      </div>
                    )}

                    {/* Dropdown Results */}
                    {(activeTab === "stores" ? storeResults : driverResults)
                      .length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl z-10 max-h-[300px] overflow-y-auto p-2 space-y-1 animate-fade-in">
                        {(activeTab === "stores"
                          ? storeResults
                          : driverResults
                        ).map((item: any) => {
                          const alreadyAssigned =
                            activeTab === "stores"
                              ? (assignedStores as any[]).some(
                                  (s) =>
                                    String(s.storeId) === String(item.id) ||
                                    String(s.store?.id) === String(item.id),
                                )
                              : assignedDrivers.some(
                                  (d) =>
                                    d.driverId === item.id ||
                                    d.driver?.id === item.id,
                                );

                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {activeTab === "stores" ? (
                                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-50">
                                    {item.logoUrl ? (
                                      <img
                                        src={item.logoUrl}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Building2
                                        size={16}
                                        className="text-gray-400"
                                      />
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-brand/5 flex items-center justify-center text-brand text-lg">
                                    🛵
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-bold text-gray-900">
                                    {activeTab === "stores"
                                      ? item.name
                                      : item.application
                                        ? `${item.application.firstName} ${item.application.familyName}`
                                        : item.phone}
                                  </p>
                                  <p className="text-[11px] text-gray-400 font-semibold">
                                    {activeTab === "stores"
                                      ? item.city?.name
                                      : item.phone}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  activeTab === "stores"
                                    ? handleAddStore(item)
                                    : handleAddDriver(item)
                                }
                                disabled={alreadyAssigned}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${alreadyAssigned ? "text-gray-400 bg-gray-100 cursor-not-allowed" : "text-brand bg-brand/10 hover:bg-brand hover:text-white"}`}
                              >
                                {alreadyAssigned ? (
                                  "Assigned"
                                ) : (
                                  <>
                                    <Plus size={14} /> Assign
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* List Content */}
                  <div className="space-y-4 flex-1">
                    <h3 className="text-sm font-bold text-gray-900 ml-1">
                      Currently Assigned{" "}
                      {activeTab === "stores" ? "Stores" : "Drivers"}
                    </h3>

                    {(
                      (activeTab === "stores"
                        ? assignedStores
                        : assignedDrivers) || []
                    ).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 bg-white/50 border border-gray-100 border-dashed rounded-3xl text-center">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-4">
                          {activeTab === "stores" ? (
                            <Building2 size={24} />
                          ) : (
                            <Car size={24} />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 font-medium">
                          No {activeTab} linked to this zone yet.
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Use the search bar above to start adding items.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
                        {(activeTab === "stores"
                          ? assignedStores
                          : assignedDrivers
                        ).map((link: any) => {
                          const item =
                            activeTab === "stores" ? link.store : link.driver;

                          // Safety: if the related record is missing (orphaned FK),
                          // show a warning card instead of silently hiding it
                          if (!item) {
                            return (
                              <div key={link.id} className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
                                <AlertTriangle size={18} className="text-red-400 shrink-0" />
                                <div>
                                  <p className="text-xs font-bold text-red-700">Data error</p>
                                  <p className="text-[11px] text-red-500">This record is missing from the database. Remove it below.</p>
                                </div>
                                <button
                                  onClick={() => activeTab === "stores"
                                    ? handleRemoveStore(link.storeId)
                                    : handleRemoveDriver(link.driverId)}
                                  className="ml-auto p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            );
                          }

                          const name =
                            activeTab === "stores"
                              ? item.name
                              : item.application
                                ? `${item.application.firstName} ${item.application.familyName}`
                                : item.phone;

                          return (
                            <div
                              key={link.id}
                              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-3">
                                {activeTab === "stores" ? (
                                  <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
                                    {item.logoUrl ? (
                                      <img
                                        src={item.logoUrl}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Building2
                                        size={18}
                                        className="text-gray-300"
                                      />
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-11 h-11 rounded-xl bg-brand/5 flex items-center justify-center text-xl">
                                    🛵
                                  </div>
                                )}
                                <div>
                                  <p className="text-[13px] font-bold text-gray-900 leading-tight mb-1">
                                    {name}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${item.isActive || item.isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-gray-300"}`}
                                    />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                      {activeTab === "stores"
                                        ? item.isActive
                                          ? "Active"
                                          : "Inactive"
                                        : item.isOnline
                                          ? "Online"
                                          : "Offline"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  activeTab === "stores"
                                    ? handleRemoveStore(link.storeId || item.id)
                                    : handleRemoveDriver(
                                        link.driverId || item.id,
                                      )
                                }
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneEditorPage;
