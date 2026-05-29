import React from "react";
import type { ZoneDriver, ZoneStore, Zone } from "../api/zones.api";
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
  Info,
  Loader2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { useZoneEditor } from "../hooks/useZoneEditor";

const PRESET_COLORS = [
  "#FF5A00", // Brand
  "#00B112", // Green
  "#0070F3", // Blue
  "#7928CA", // Purple
  "#F59E0B", // Amber
  "#EF4444", // Red
];

const ZoneEditorPage: React.FC = () => {
  const { state, actions, router } = useZoneEditor();
  const { form, geocoding, stores, drivers, ui } = state;
  const { navigate } = router;

  return (
    <div className="min-h-screen bg-[#F9FAFB] animate-fade-in pb-12">
      {/* Header */}
      <div className="sticky top-0 z-50 glass border-b border-gray-100/50 px-4 lg:px-12 py-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/zones")}
            className="group p-3 text-gray-400 hover:text-brand hover:bg-brand/5 rounded-2xl transition-all duration-300"
          >
            <ArrowLeft
              size={22}
              className="group-hover:-translate-x-1 transition-transform"
            />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center text-brand premium-shadow ring-4 ring-brand/5">
              <MapPin size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                {form.mode === "create" ? "Create Zone" : "Edit Zone"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.1em]">
                  {form.mode === "create"
                    ? "Delivery Area Definition"
                    : `ID: ${form.id?.slice(0, 8)}…`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          className="group inline-flex items-center gap-3 px-8 py-3.5 bg-brand text-white font-black rounded-2xl hover:bg-brand-dark transition-all duration-300 premium-shadow-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          onClick={actions.handleSave}
          disabled={ui.saving}
        >
          {ui.saving ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Save
              size={20}
              className="group-hover:rotate-12 transition-transform"
            />
          )}
          <span>{ui.saving ? "Saving Changes…" : "Save Zone"}</span>
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 lg:p-12 animate-slide-up">
        {ui.saveError && (
          <div className="mb-8 flex items-center gap-4 p-5 bg-red-50 border border-red-100/50 rounded-[24px] text-red-600 shadow-sm animate-shake">
            <AlertTriangle size={20} className="shrink-0" />
            <p className="text-sm font-bold">{ui.saveError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Form */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl premium-shadow space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-gray-900">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                    <Info size={16} className="text-brand" />
                  </div>
                  <h2 className="text-lg font-black tracking-tight">
                    Zone Config
                  </h2>
                </div>
                <div className="px-3 py-1 bg-gray-50 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Required *
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2.5 relative">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
                    Zone Name / Search Location
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => {
                        form.setName(e.target.value);
                        geocoding.setShowNameSuggestions(true);
                      }}
                      onFocus={() => {
                        if (form.name.trim())
                          geocoding.setShowNameSuggestions(true);
                      }}
                      onBlur={() => {
                        setTimeout(
                          () => geocoding.setShowNameSuggestions(false),
                          200,
                        );
                      }}
                      placeholder="e.g. Maadi Residential Area"
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand/50 focus:bg-white transition-all duration-300 text-gray-900 font-bold placeholder:text-gray-300 pr-12 shadow-inner"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                      {geocoding.isSearchingName ? (
                        <Loader2
                          size={18}
                          className="text-brand animate-spin"
                        />
                      ) : (
                        <Search
                          size={18}
                          className="text-gray-300 group-focus-within:text-brand transition-colors"
                        />
                      )}
                    </div>
                  </div>
                  {geocoding.showNameSuggestions &&
                    geocoding.nameSuggestions.length > 0 && (
                      <div className="absolute top-full mt-3 left-0 right-0 bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-3xl z-[100] max-h-[300px] overflow-hidden p-2 animate-slide-up">
                        <div className="overflow-y-auto max-h-[290px] pr-1">
                          {geocoding.nameSuggestions.map((s, idx) => (
                            <div
                              key={idx}
                              className="px-4 py-4 hover:bg-brand/5 cursor-pointer rounded-2xl transition-all group flex items-start gap-4 mb-1 last:mb-0"
                              onClick={() =>
                                actions.handleSelectNameSuggestion(s)
                              }
                            >
                              <div className="w-9 h-9 rounded-xl bg-gray-50 group-hover:bg-brand/10 flex items-center justify-center shrink-0 transition-colors">
                                <MapPin
                                  size={16}
                                  className="text-gray-400 group-hover:text-brand transition-colors"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-black text-gray-900 leading-tight">
                                  {s.name || s.display_name.split(",")[0]}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1 font-medium line-clamp-1">
                                  {s.display_name}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2.5">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
                      Country
                    </label>
                    <div className="relative">
                      <select
                        value="EG"
                        disabled
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 font-bold appearance-none cursor-not-allowed opacity-60 shadow-inner"
                      >
                        <option value="EG">Egypt</option>
                      </select>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                        🇪🇬
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
                      City
                    </label>
                    <div className="relative">
                      <select
                        value={form.cityId}
                        onChange={async (e) => {
                          const id = e.target.value;
                          form.setCityId(id);
                          const selectedCity = form.cities.find(
                            (c) => c.id === id,
                          );
                          if (selectedCity) {
                            const selectedCountryName = "Egypt";
                            const query =
                              `${selectedCity.name}, ${selectedCountryName}`.trim();
                            try {
                              const res = await fetch(
                                `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
                              );
                              const data = await res.json();
                              if (data && data.length > 0) {
                                ui.setMapCenter([
                                  parseFloat(data[0].lat),
                                  parseFloat(data[0].lon),
                                ]);
                              }
                            } catch (err) {
                              console.error(
                                "Failed to fetch city coords:",
                                err,
                              );
                            }
                          }
                        }}
                        className="w-full pl-5 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand/50 focus:bg-white transition-all duration-300 text-gray-900 font-bold appearance-none shadow-inner"
                      >
                        <option value="">Select City</option>
                        {form.cities.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronDown size={18} className="stroke-[3]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => form.setDescription(e.target.value)}
                    placeholder="Describe delivery rules, zone limits..."
                    rows={3}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand/50 focus:bg-white transition-all duration-300 text-gray-900 font-bold placeholder:text-gray-300 resize-none shadow-inner"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
                    Map visualization color
                  </label>
                  <div className="grid grid-cols-6 gap-3">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => form.setColor(c)}
                        className={`w-full aspect-square rounded-xl transition-all duration-300 border-4 ${form.color === c ? "scale-110 border-white shadow-lg ring-2 ring-brand" : "border-transparent opacity-80 hover:opacity-100"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <div className="relative w-full aspect-square group">
                      <input
                        type="color"
                        value={form.color}
                        onChange={(e) => form.setColor(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div
                        className={`w-full h-full rounded-xl flex items-center justify-center border-2 border-dashed ${!PRESET_COLORS.includes(form.color) ? "border-brand bg-brand/5 text-brand" : "border-gray-200 text-gray-400"} transition-all group-hover:border-brand group-hover:text-brand`}
                      >
                        <Plus size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`p-6 rounded-[32px] border-2 flex items-center gap-5 transition-all duration-500 premium-shadow ${form.geojson ? "bg-green-50/50 border-green-100 text-green-700 ring-4 ring-green-500/5" : "bg-brand/5 border-brand/10 text-brand ring-4 ring-brand/5"}`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${form.geojson ? "bg-green-500 text-white" : "bg-brand text-white"}`}
              >
                <MapPin
                  size={24}
                  className={form.geojson ? "" : "animate-bounce"}
                />
              </div>
              <div>
                <p className="text-base font-black tracking-tight">
                  {form.geojson ? "Boundary Defined" : "Pending Boundary"}
                </p>
                <p className="text-[11px] font-bold opacity-70 uppercase tracking-widest mt-0.5">
                  {form.geojson
                    ? "Delivery area successfully mapped"
                    : "Draw the zone area on the map"}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Map + Stores tabs */}
          <div className="lg:col-span-8 bg-white rounded-[40px] border border-gray-100 shadow-2xl premium-shadow overflow-hidden flex flex-col min-h-[750px] animate-slide-in-right">
            <div className="flex border-b border-gray-50 bg-[#F9FAFB]/50 p-2 gap-1.5 backdrop-blur-sm">
              <button
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[24px] text-sm font-black tracking-tight transition-all duration-300 ${ui.activeTab === "map" ? "bg-white text-brand shadow-lg premium-shadow ring-1 ring-black/5" : "text-gray-400 hover:text-gray-600 hover:bg-white/50"}`}
                onClick={() => ui.setActiveTab("map")}
              >
                <MapPin size={18} /> Map Editor
              </button>
              {form.mode === "edit" && (
                <>
                  <button
                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[24px] text-sm font-black tracking-tight transition-all duration-300 ${ui.activeTab === "stores" ? "bg-white text-brand shadow-lg premium-shadow ring-1 ring-black/5" : "text-gray-400 hover:text-gray-600 hover:bg-white/50"}`}
                    onClick={() => ui.setActiveTab("stores")}
                  >
                    <Building2 size={18} /> Linked Stores
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] ${ui.activeTab === "stores" ? "bg-brand/10 text-brand" : "bg-gray-100 text-gray-400"}`}
                    >
                      {stores.assignedStores?.length ?? 0}
                    </span>
                  </button>
                  <button
                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[24px] text-sm font-black tracking-tight transition-all duration-300 ${ui.activeTab === "drivers" ? "bg-white text-brand shadow-lg premium-shadow ring-1 ring-black/5" : "text-gray-400 hover:text-gray-600 hover:bg-white/50"}`}
                    onClick={() => ui.setActiveTab("drivers")}
                  >
                    <Car size={18} /> Fleet
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] ${ui.activeTab === "drivers" ? "bg-brand/10 text-brand" : "bg-gray-100 text-gray-400"}`}
                    >
                      {drivers.assignedDrivers?.length ?? 0}
                    </span>
                  </button>
                </>
              )}
            </div>

            <div className="flex-1 relative flex flex-col">
              {ui.activeTab === "map" && (
                <div className="absolute inset-0">
                  <ZoneMapEditor
                    initialPolygon={form.initialPolygon}
                    onChange={form.setGeojson}
                    height="100%"
                    centerOn={ui.mapCenter}
                    color={form.color}
                  />
                </div>
              )}

              {(ui.activeTab === "stores" || ui.activeTab === "drivers") && (
                <div className="p-6 flex flex-col h-full bg-gray-50/30 overflow-y-auto">
                  {/* Search Bar */}
                  <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={
                        ui.activeTab === "stores"
                          ? "Search stores by name…"
                          : "Search drivers by name or phone…"
                      }
                      value={
                        ui.activeTab === "stores"
                          ? stores.storeSearch
                          : drivers.driverSearch
                      }
                      onChange={(e) =>
                        ui.activeTab === "stores"
                          ? stores.setStoreSearch(e.target.value)
                          : drivers.setDriverSearch(e.target.value)
                      }
                      className="w-full pl-12 pr-12 py-4 bg-white border border-gray-100 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand/50 transition-all duration-300 text-sm font-bold shadow-sm placeholder:text-gray-300"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {stores.searchingStores || drivers.searchingDrivers ? (
                        <Loader2
                          size={16}
                          className="text-brand animate-spin"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400">
                          ⌘K
                        </div>
                      )}
                    </div>

                    {/* Dropdown Results */}
                    {(ui.activeTab === "stores"
                      ? stores.storeResults
                      : drivers.driverResults
                    ).length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl rounded-[28px] border border-gray-100 shadow-2xl z-[100] max-h-[350px] overflow-hidden p-2 animate-slide-up">
                        <div className="overflow-y-auto max-h-[330px] pr-1">
                          {(ui.activeTab === "stores"
                            ? stores.storeResults
                            : drivers.driverResults
                          ).map((rawItem) => {
                            const isStore = ui.activeTab === "stores";
                            const storeItem = rawItem as ZoneStore;
                            const driverItem = rawItem as ZoneDriver;

                            const alreadyAssigned = isStore
                              ? (stores.assignedStores || []).some(
                                  (s) =>
                                    String(s.storeId) ===
                                      String(storeItem.id) ||
                                    String(s.store?.id) ===
                                      String(storeItem.id),
                                )
                              : (drivers.assignedDrivers || []).some(
                                  (d) =>
                                    d.driverId === driverItem.id ||
                                    d.driver?.id === driverItem.id,
                                );

                            return (
                              <div
                                key={isStore ? storeItem.id : driverItem.id}
                                className="flex items-center justify-between p-3.5 hover:bg-brand/5 rounded-[20px] transition-all duration-300 group mb-1 last:mb-0"
                              >
                                <div className="flex items-center gap-4">
                                  {isStore ? (
                                    <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm transition-transform group-hover:scale-105">
                                      {storeItem.logoUrl ? (
                                        <img
                                          src={storeItem.logoUrl}
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
                                    <div className="w-11 h-11 rounded-xl bg-brand/5 flex items-center justify-center text-brand text-xl shadow-sm transition-transform group-hover:scale-105">
                                      🛵
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-black text-gray-900 leading-tight">
                                      {isStore
                                        ? storeItem.name
                                        : driverItem.application
                                          ? `${driverItem.application.firstName} ${driverItem.application.familyName}`
                                          : driverItem.phone}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                        {isStore
                                          ? storeItem.city?.name || "Global"
                                          : driverItem.phone}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    isStore
                                      ? actions.handleAddStore(storeItem)
                                      : actions.handleAddDriver(driverItem)
                                  }
                                  disabled={alreadyAssigned}
                                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${alreadyAssigned ? "text-gray-400 bg-gray-50 cursor-not-allowed" : "text-brand bg-brand/5 hover:bg-brand hover:text-white hover:shadow-lg hover:shadow-brand/20 active:scale-95"}`}
                                >
                                  {alreadyAssigned ? (
                                    "Assigned"
                                  ) : (
                                    <>
                                      <Plus size={14} className="stroke-[3]" />{" "}
                                      Assign
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* List Content */}
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center justify-between ml-1">
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                        Currently Assigned
                      </h3>
                      <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                        {
                          (
                            (ui.activeTab === "stores"
                              ? stores.assignedStores
                              : drivers.assignedDrivers) || []
                          ).length
                        }{" "}
                        items
                      </span>
                    </div>

                    {(
                      (ui.activeTab === "stores"
                        ? stores.assignedStores
                        : drivers.assignedDrivers) || []
                    ).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 bg-white/50 border-2 border-gray-100 border-dashed rounded-[32px] text-center animate-fade-in">
                        <div className="w-20 h-20 bg-gray-50 rounded-[28px] flex items-center justify-center text-gray-200 mb-6 shadow-inner ring-8 ring-gray-50/50">
                          {ui.activeTab === "stores" ? (
                            <Building2 size={32} />
                          ) : (
                            <Car size={32} />
                          )}
                        </div>
                        <p className="text-base font-black text-gray-900 tracking-tight">
                          No {ui.activeTab === "stores" ? "stores" : "drivers"}{" "}
                          assigned
                        </p>
                        <p className="text-xs text-gray-400 mt-2 max-w-[200px] mx-auto font-medium">
                          Search above to link delivery resources to this zone
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-12 animate-slide-up">
                        {(ui.activeTab === "stores"
                          ? stores.assignedStores || []
                          : drivers.assignedDrivers || []
                        ).map((rawLink) => {
                          const isStore = ui.activeTab === "stores";
                          const storeLink = rawLink as NonNullable<
                            Zone["storeZones"]
                          >[0];
                          const driverLink = rawLink as NonNullable<
                            Zone["driverZones"]
                          >[0];

                          const item = isStore
                            ? storeLink.store
                            : driverLink.driver;
                          const linkId = isStore ? storeLink.id : driverLink.id;

                          // Safety: if the related record is missing (orphaned FK),
                          // show a warning card instead of silently hiding it
                          if (!item) {
                            return (
                              <div
                                key={linkId}
                                className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3"
                              >
                                <AlertTriangle
                                  size={18}
                                  className="text-red-400 shrink-0"
                                />
                                <div>
                                  <p className="text-xs font-bold text-red-700">
                                    Data error
                                  </p>
                                  <p className="text-[11px] text-red-500">
                                    This record is missing from the database.
                                    Remove it below.
                                  </p>
                                </div>
                                <button
                                  onClick={() =>
                                    isStore
                                      ? actions.handleRemoveStore(
                                          storeLink.storeId,
                                        )
                                      : actions.handleRemoveDriver(
                                          driverLink.driverId,
                                        )
                                  }
                                  className="ml-auto p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            );
                          }

                          const storeItem = item as ZoneStore;
                          const driverItem = item as ZoneDriver;

                          const name = isStore
                            ? storeItem.name
                            : driverItem.application
                              ? `${driverItem.application.firstName} ${driverItem.application.familyName}`
                              : driverItem.phone;

                          return (
                            <div
                              key={linkId}
                              className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm premium-shadow flex items-center justify-between group hover:shadow-xl hover:border-brand/20 transition-all duration-300 animate-slide-up"
                            >
                              <div className="flex items-center gap-4">
                                {isStore ? (
                                  <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center transition-transform group-hover:scale-110">
                                    {storeItem.logoUrl ? (
                                      <img
                                        src={storeItem.logoUrl}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Building2
                                        size={22}
                                        className="text-gray-300"
                                      />
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-14 h-14 rounded-2xl bg-brand/5 flex items-center justify-center text-2xl transition-transform group-hover:scale-110">
                                    🛵
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-black text-gray-900 leading-tight mb-1.5">
                                    {name}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-md">
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${storeItem.isActive || driverItem.isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-gray-300"}`}
                                      />
                                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                        {isStore
                                          ? storeItem.isActive
                                            ? "Active"
                                            : "Inactive"
                                          : driverItem.isOnline
                                            ? "Online"
                                            : "Offline"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  isStore
                                    ? actions.handleRemoveStore(
                                        storeLink.storeId || storeItem.id,
                                      )
                                    : actions.handleRemoveDriver(
                                        driverLink.driverId || driverItem.id,
                                      )
                                }
                                className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 duration-300"
                              >
                                <X size={18} className="stroke-[3]" />
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
