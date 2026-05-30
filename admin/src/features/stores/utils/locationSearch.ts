export interface PlaceResult {
  id: string;
  lat: string;
  lng: string;
  name: string;
  address: string;
  source: "nominatim" | "photon";
}

/** Nominatim (OpenStreetMap) — great for structured addresses */
export const searchNominatim = async (q: string): Promise<PlaceResult[]> => {
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
export const searchPhoton = async (q: string): Promise<PlaceResult[]> => {
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
export const mergeResults = (a: PlaceResult[], b: PlaceResult[]): PlaceResult[] => {
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
