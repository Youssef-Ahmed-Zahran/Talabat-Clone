import { Shield, Phone, Calendar, MapPin, Truck } from "lucide-react";
import type { Driver } from "../../../types";

interface DriverApplicationDetailsProps {
  driver: Driver;
}

export function DriverApplicationDetails({
  driver,
}: DriverApplicationDetailsProps) {
  const application = driver.application;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
          Application Details
        </h3>
        <Shield className="w-4 h-4 text-gray-400" />
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            Phone Number
          </p>
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <Phone className="w-4 h-4 text-brand" />
            {application?.phone || driver.phone || "—"}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            Date of Birth
          </p>
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <Calendar className="w-4 h-4 text-brand" />
            {application?.dateOfBirth
              ? new Date(application.dateOfBirth).toLocaleDateString()
              : "—"}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            National ID
          </p>
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <Shield className="w-4 h-4 text-brand" />
            {application?.nationalId || "—"}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            Governorate
          </p>
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <MapPin className="w-4 h-4 text-brand" />
            {application?.governorate?.name || driver.city?.name || "—"}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            Vehicle Type
          </p>
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <Truck className="w-4 h-4 text-brand" />
            {application?.vehicleType || "—"}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            Vehicle Plate
          </p>
          <div className="flex items-center gap-2 text-gray-900 font-semibold text-brand bg-brand/5 px-2 py-0.5 rounded-lg w-fit">
            {application?.vehiclePlateNumber || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
