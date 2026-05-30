import { Info, Phone, Mail, MapPin, Activity } from "lucide-react";
import type { Store } from "../../../../types";

interface StoreInfoCardsProps {
  store: Store;
}

export function StoreInfoCards({ store }: StoreInfoCardsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Contact & Location */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-400" />
            Contact Info
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  Phone Number
                </p>
                <p className="text-[13px] text-gray-900 font-medium mt-0.5">
                  {store.phone || "Not provided"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  Email Address
                </p>
                <p className="text-[13px] text-gray-900 font-medium mt-0.5">
                  {store.email || "Not provided"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            Location
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  Full Address
                </p>
                <p className="text-[13px] text-gray-900 font-medium mt-0.5 leading-relaxed">
                  {store.address || "No physical address provided."}
                </p>
              </div>
            </div>
            {(store.latitude || store.longitude) && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">
                  GPS Coordinates
                </p>
                <p className="text-sm font-mono text-gray-900 mt-1">
                  {store.latitude}, {store.longitude}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Settings & Operational Details */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400" />
            Operational Configuration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500 font-medium mb-1">
                Delivery Protocol
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {store.deliveryType === "TALABAT_DELIVERY"
                  ? "Platform Delivery (Talabat)"
                  : "Store Delivery"}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500 font-medium mb-1">
                Delivery Fees
              </p>
              <p className="text-sm font-semibold text-gray-900">
                EGP {store.deliveryFees || 0}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500 font-medium mb-1">
                Pre-ordering
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className={`w-2 h-2 rounded-full ${store.allowPreorder ? "bg-emerald-500" : "bg-red-500"}`}
                />
                <span className="text-sm font-semibold text-gray-900">
                  {store.allowPreorder ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500 font-medium mb-1">
                Category Group
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {store.mainCategory?.name || "Uncategorized"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
