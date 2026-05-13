import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { Info } from "lucide-react";
import type { GeoJSONPolygon } from "../api/zones.api";
import { fetchAllZones } from "../api/zones.api";

// Fix Leaflet default marker icon broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface ZoneMapEditorProps {
  /** Initial GeoJSON polygon to display (for editing) */
  initialPolygon?: GeoJSONPolygon | null;
  /** Called when the polygon is drawn/updated */
  onChange: (geojson: GeoJSONPolygon) => void;
  /** Show all existing zones as overlays */
  showExistingZones?: boolean;
  /** Height of the map container */
  height?: string;
  /** Fly map to this [lat, lng] when it changes (triggered by city selection) */
  centerOn?: [number, number] | null;
  /** Primary color for the active zone polygon */
  color?: string;
}

const ZoneMapEditor: React.FC<ZoneMapEditorProps> = ({
  initialPolygon,
  onChange,
  showExistingZones = true,
  height = "500px",
  centerOn,
  color = "#FF5A00",
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const drawnLayersRef = useRef<L.FeatureGroup | null>(null);
  const [existingZones, setExistingZones] = useState<
    { name: string; boundary: GeoJSONPolygon; color?: string }[]
  >([]);

  // Load existing zone overlays
  useEffect(() => {
    if (showExistingZones) {
      fetchAllZones()
        .then((zones) =>
          setExistingZones(
            zones
              .filter((z) => z.boundary)
              .map((z) => ({
                name: z.name,
                boundary: z.boundary!,
                color: z.color || "#FF5733",
              })),
          ),
        )
        .catch(() => {});
    }
  }, [showExistingZones]);

  // Initialise the Leaflet map (runs once)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [30.0444, 31.2357], // Cairo default
      zoom: 11,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    drawnItems.addTo(map);
    drawnLayersRef.current = drawnItems;

    type LeafletDrawExtension = typeof L & {
      Control: { Draw: new (options: unknown) => L.Control };
      Draw: { Event: { CREATED: string; EDITED: string } };
    };
    const LDraw = L as unknown as LeafletDrawExtension;

    const drawControl = new LDraw.Control.Draw({
      draw: {
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: { color, fillOpacity: 0.2, weight: 3 },
        },
      },
      edit: { featureGroup: drawnItems },
    });
    map.addControl(drawControl);

    if (initialPolygon) {
      const layer = L.geoJSON(
        initialPolygon as unknown as import("geojson").GeoJSON,
        {
          style: { color, fillOpacity: 0.2, weight: 3 },
        },
      );
      layer.eachLayer((l) => drawnItems.addLayer(l));
      map.fitBounds(layer.getBounds(), { padding: [40, 40] });
    }

    map.on(LDraw.Draw.Event.CREATED, (e: unknown) => {
      const event = e as {
        layer: L.Layer & { toGeoJSON: () => { geometry: GeoJSONPolygon } };
      };
      drawnItems.clearLayers();
      drawnItems.addLayer(event.layer);
      onChange(event.layer.toGeoJSON().geometry);
    });

    map.on(LDraw.Draw.Event.EDITED, (e: unknown) => {
      const event = e as { layers: L.LayerGroup };
      event.layers.eachLayer((layer: unknown) => {
        const l = layer as L.Layer & {
          toGeoJSON: () => { geometry: GeoJSONPolygon };
        };
        onChange(l.toGeoJSON().geometry);
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Smoothly fly to city whenever centerOn changes ─────────────
  useEffect(() => {
    if (!mapRef.current || !centerOn) return;
    mapRef.current.flyTo(centerOn, 12, { animate: true, duration: 1.2 });
  }, [centerOn]);

  // Draw existing zone overlays when loaded
  useEffect(() => {
    if (!mapRef.current || !existingZones.length) return;
    existingZones.forEach((z) => {
      const layer = L.geoJSON(
        z.boundary as unknown as import("geojson").GeoJSON,
        {
          style: {
            color: z.color || "#FF5733",
            fillOpacity: 0.08,
            weight: 1.5,
            dashArray: "6 4",
          },
        },
      );
      layer.bindTooltip(z.name, { permanent: false, sticky: true });
      layer.addTo(mapRef.current!);
    });
  }, [existingZones]);

  // ── Sync active polygon color when color prop changes ──────────
  useEffect(() => {
    if (!drawnLayersRef.current) return;
    drawnLayersRef.current.eachLayer((layer: unknown) => {
      const l = layer as L.Layer & { setStyle?: (style: unknown) => void };
      if (l.setStyle) {
        l.setStyle({ color, fillOpacity: 0.2 });
      }
    });
  }, [color]);

  return (
    <div className="w-full h-full flex flex-col">
      <div
        ref={mapContainerRef}
        className="flex-1 rounded-2xl border border-gray-200 overflow-hidden shadow-inner"
        style={{ height }}
      />
      <div className="mt-3 flex items-start gap-2 text-xs text-gray-400 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
        <Info size={14} className="text-brand shrink-0 mt-0.5" />
        <p>
          Click the{" "}
          <strong className="text-gray-600 font-bold uppercase tracking-wider text-[10px]">
            polygon tool
          </strong>{" "}
          in the top-left of the map to draw. Existing zones appear as dashed
          overlays for reference.
        </p>
      </div>
    </div>
  );
};

export default ZoneMapEditor;
