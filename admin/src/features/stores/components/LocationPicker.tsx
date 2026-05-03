import { useState, useRef, useCallback, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { Search, Loader2, MapPin, X } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons in Vite
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: string })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationPickerProps {
  latitude: string;
  longitude: string;
  onChange: (lat: string, lng: string, address?: string) => void;
}

interface PlaceResult {
  id: string;
  lat: string;
  lng: string;
  name: string;
  address: string;
  source: "nominatim" | "photon";
}

// ── Map sub-components ──────────────────────────────────────────────────────
const MapClickHandler = ({
  onLocationSelect,
}: {
  onLocationSelect: (lat: string, lng: string) => void;
}) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
    },
  });
  return null;
};

const FlyToLocation = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
};

// ── Search engine helpers ───────────────────────────────────────────────────

/** Nominatim (OpenStreetMap) — great for structured addresses */
const searchNominatim = async (q: string): Promise<PlaceResult[]> => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`,
    { headers: { "Accept-Language": "en,ar" } },
  );
  const data = await res.json();
  return data.map(
    (
      r: { place_id?: number; lat: string; lon: string; display_name: string },
      i: number,
    ) => ({
      id: `nominatim-${r.place_id ?? i}`,
      lat: r.lat,
      lng: r.lon,
      name: r.display_name.split(",")[0],
      address: r.display_name.split(",").slice(1, 3).join(",").trim(),
      source: "nominatim" as const,
    }),
  );
};

/** Photon (Komoot) — better for POI / business names */
const searchPhoton = async (q: string): Promise<PlaceResult[]> => {
  const res = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=en`,
  );
  const data = await res.json();
  return (data.features ?? []).map(
    (
      f: {
        geometry: { coordinates: number[] };
        properties?: {
          name?: string;
          street?: string;
          city?: string;
          state?: string;
          country?: string;
          osm_id?: number;
        };
      },
      i: number,
    ) => {
      const props = f.properties ?? {};
      const name = props.name || props.street || q;
      const parts = [props.city, props.state, props.country].filter(Boolean);
      return {
        id: `photon-${props.osm_id ?? i}`,
        lat: String(f.geometry.coordinates[1]),
        lng: String(f.geometry.coordinates[0]),
        name,
        address: parts.join(", "),
        source: "photon" as const,
      };
    },
  );
};

/** Merge + deduplicate results from both engines */
const mergeResults = (a: PlaceResult[], b: PlaceResult[]): PlaceResult[] => {
  const seen = new Set<string>();
  const merged: PlaceResult[] = [];
  [...a, ...b].forEach((r) => {
    const key = `${parseFloat(r.lat).toFixed(3)},${parseFloat(r.lng).toFixed(3)}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(r);
    }
  });
  return merged.slice(0, 8);
};

// ── Main Component ──────────────────────────────────────────────────────────
export const LocationPicker = ({
  latitude,
  longitude,
  onChange,
}: LocationPickerProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const defaultCenter: [number, number] = [30.0444, 31.2357];
  const center: [number, number] =
    latitude && longitude
      ? [parseFloat(latitude), parseFloat(longitude)]
      : defaultCenter;

  // ── Debounced dual-source search ──────────────────────────────────────────
  const handleQueryChange = (value: string) => {
    setQuery(value);
    setShowDropdown(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        // fire both in parallel, use whichever finishes
        const [nominatimResults, photonResults] = await Promise.allSettled([
          searchNominatim(value),
          searchPhoton(value),
        ]);

        const nom =
          nominatimResults.status === "fulfilled" ? nominatimResults.value : [];
        const pho =
          photonResults.status === "fulfilled" ? photonResults.value : [];
        const merged = mergeResults(nom, pho);
        setResults(merged);
        setShowDropdown(true);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const selectResult = useCallback(
    (result: PlaceResult) => {
      const lat = parseFloat(result.lat).toFixed(6);
      const lng = parseFloat(result.lng).toFixed(6);
      onChange(lat, lng, `${result.name}, ${result.address}`);
      setFlyTarget({
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lng),
      });
      setQuery(`${result.name}${result.address ? ", " + result.address : ""}`);
      setShowDropdown(false);
    },
    [onChange],
  );

  const handleMapClick = useCallback(
    (lat: string, lng: string) => {
      onChange(lat, lng);
      setFlyTarget(null);
    },
    [onChange],
  );

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* ── Search Bar ─────────────────────────────────────────── */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search streets, shops, landmarks..."
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── Results Dropdown ─────────────────────────────────── */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.1)] z-[9999] overflow-hidden">
            {results.length > 0
              ? results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onMouseDown={() => selectResult(r)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-orange-50 text-left border-b border-gray-50 last:border-0 transition-colors group"
                  >
                    <MapPin className="w-4 h-4 text-brand mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-[13px] font-medium text-gray-800 leading-tight">
                        {r.name}
                      </p>
                      {r.address && (
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                          {r.address}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              : !isSearching && (
                  <p className="px-4 py-3 text-sm text-gray-500 text-center">
                    No results found. Try a different term or click on the map.
                  </p>
                )}
          </div>
        )}
      </div>

      {/* ── Map ────────────────────────────────────────────────── */}
      <div className="w-full h-[270px] rounded-xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
        <MapContainer
          center={center}
          zoom={14}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={handleMapClick} />
          {flyTarget && (
            <FlyToLocation lat={flyTarget.lat} lng={flyTarget.lng} />
          )}
          {latitude && longitude && (
            <Marker position={[parseFloat(latitude), parseFloat(longitude)]} />
          )}
        </MapContainer>

        {!latitude && !longitude && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] bg-black/60 text-white text-[11px] px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
            Search above or click on the map to drop a pin
          </div>
        )}
      </div>
    </div>
  );
};
