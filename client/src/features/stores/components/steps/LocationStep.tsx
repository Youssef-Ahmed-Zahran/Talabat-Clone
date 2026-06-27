import { useFormContext } from "react-hook-form";
import { Navigation } from "lucide-react";
import toast from "react-hot-toast";
import type { StoreFormValues } from "../../../../schemas/store.schema";
import { LocationPicker } from "../location/LocationPicker";

interface Zone {
  id: string;
  name: string;
}

interface LocationStepProps {
  zones: Zone[];
  selectedZoneId: string;
  setSelectedZoneId: (id: string) => void;
}

export function LocationStep({
  zones,
  selectedZoneId,
  setSelectedZoneId,
}: LocationStepProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<StoreFormValues>();

  const lat = watch("latitude");
  const lng = watch("longitude");

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="space-y-4">
        <div className="h-[300px] rounded-3xl overflow-hidden border border-gray-100 shadow-inner">
          <LocationPicker
            latitude={lat || ""}
            longitude={lng || ""}
            onChange={(nLat, nLng, addr) => {
              setValue("latitude", nLat || "");
              setValue("longitude", nLng || "");
              if (addr) setValue("address", addr);
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((pos) => {
                setValue("latitude", String(pos.coords.latitude));
                setValue("longitude", String(pos.coords.longitude));
                toast.success("Coordinates updated!");
              });
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-3 bg-brand/5 text-brand text-xs font-bold rounded-2xl hover:bg-brand/10 transition-all"
        >
          <Navigation className="w-3.5 h-3.5" />
          Detect My Current Position
        </button>

        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Full Street Address *
          </label>
          <textarea
            {...register("address")}
            rows={2}
            className={`w-full px-4 py-3 bg-gray-50 border ${errors.address ? "border-red-500" : "border-gray-100"} rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all resize-none`}
          />
        </div>

        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Assigned Zone
          </label>
          <select
            value={selectedZoneId}
            onChange={(e) => setSelectedZoneId(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all appearance-none"
          >
            <option value="">Auto-detect from coordinates</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
