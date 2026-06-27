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
        <div className="bg-white rounded-3xl border border-gray-100/80 p-8 premium-shadow">
          <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-400" />
            Contact Info
          </h3>
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                  Phone Number
                </p>
                <p className="text-[13px] text-gray-900 font-bold mt-0.5">
                  {store.phone || "Not provided"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                  Email Address
                </p>
                <p className="text-[13px] text-gray-900 font-bold mt-0.5">
                  {store.email || "Not provided"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100/80 p-8 premium-shadow">
          <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            Location
          </h3>
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                  Full Address
                </p>
                <p className="text-[13px] text-gray-900 font-medium mt-1 leading-relaxed">
                  {store.address || "No physical address provided."}
                </p>
              </div>
            </div>
            {(store.latitude || store.longitude) && (
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100/50 text-center mt-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                  GPS Coordinates
                </p>
                <p className="text-[13px] font-mono font-bold text-gray-900">
                  {store.latitude}, {store.longitude}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Settings & Operational Details */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-3xl border border-gray-100/80 p-8 premium-shadow">
          <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-8 flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400" />
            Operational Configuration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl border border-gray-100/50 bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">
                Delivery Protocol
              </p>
              <p className="text-sm font-extrabold text-gray-900">
                {store.deliveryType === "TALABAT_DELIVERY"
                  ? "Platform Delivery (Talabat)"
                  : "Store Delivery"}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-gray-100/50 bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">
                Delivery Fees
              </p>
              <p className="text-sm font-extrabold text-gray-900">
                EGP {store.deliveryFees || 0}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-gray-100/50 bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">
                Pre-ordering
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${store.allowPreorder ? "bg-emerald-500" : "bg-red-500"}`}
                />
                <span className="text-sm font-extrabold text-gray-900">
                  {store.allowPreorder ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-gray-100/50 bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">
                Category Group
              </p>
              <p className="text-sm font-extrabold text-gray-900">
                {store.mainCategory?.name || "Uncategorized"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
