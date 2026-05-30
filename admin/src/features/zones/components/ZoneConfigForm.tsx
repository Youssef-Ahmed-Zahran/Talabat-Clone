import React from "react";
import { Search, Loader2, MapPin, ChevronDown, Plus, Info } from "lucide-react";

import { useZoneEditor } from "../hooks/useZoneEditor";

type ZoneEditorState = ReturnType<typeof useZoneEditor>["state"];
type ZoneEditorActions = ReturnType<typeof useZoneEditor>["actions"];

interface ZoneConfigFormProps {
  form: ZoneEditorState["form"];
  geocoding: ZoneEditorState["geocoding"];
  actions: ZoneEditorActions;
  ui: ZoneEditorState["ui"];
}

const PRESET_COLORS = [
  "#FF5A00", // Brand
  "#00B112", // Green
  "#0070F3", // Blue
  "#7928CA", // Purple
  "#F59E0B", // Amber
  "#EF4444", // Red
];

export const ZoneConfigForm: React.FC<ZoneConfigFormProps> = ({
  form,
  geocoding,
  actions,
  ui,
}) => {
  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl premium-shadow space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-gray-900">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
              <Info size={16} className="text-brand" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Zone Config</h2>
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
                  if (form.name.trim()) geocoding.setShowNameSuggestions(true);
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
                  <Loader2 size={18} className="text-brand animate-spin" />
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
                        onClick={() => actions.handleSelectNameSuggestion(s)}
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
                    const selectedCity = form.cities.find((c) => c.id === id);
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
                        console.error("Failed to fetch city coords:", err);
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
          <MapPin size={24} className={form.geojson ? "" : "animate-bounce"} />
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
  );
};
