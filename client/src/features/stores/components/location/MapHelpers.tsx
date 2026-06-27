import { useEffect } from "react";
import { useMapEvents, useMap } from "react-leaflet";

export const MapClickHandler = ({
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

export const FlyToLocation = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
};
