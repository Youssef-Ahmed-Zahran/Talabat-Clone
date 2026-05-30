import { Store as StoreIcon, Clock, Truck, DollarSign } from "lucide-react";
import type { Store } from "../../../../types";

interface StoreHeroProps {
  store: Store;
}

export function StoreHero({ store }: StoreHeroProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm relative overflow-hidden">
      {/* Subtle decorative background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-bl-[100px] -z-10" />

      <div className="flex flex-col sm:flex-row items-start gap-6">
        <div className="w-24 h-24 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
          {store.logoUrl ? (
            <img
              src={store.logoUrl}
              alt={store.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <StoreIcon className="w-8 h-8 text-gray-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{store.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {store.legalName || "No Legal Name Provided"}
              </p>
            </div>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                store.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-red-50 text-red-600 border-red-100"
              }`}
            >
              {store.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-[13px] text-gray-600 mt-4 leading-relaxed max-w-2xl bg-gray-50/50 p-3 rounded-lg border border-gray-50">
            {store.description || "No description provided for this store."}
          </p>
        </div>
      </div>

      {/* Quick Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-100">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 text-indigo-600">
            <StoreIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Type</p>
            <p className="text-[13px] font-bold text-gray-900 mt-0.5">
              {store.storeType || "—"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Hours</p>
            <p className="text-[13px] font-bold text-gray-900 mt-0.5">
              {store.openTime || "??"} - {store.closeTime || "??"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 text-emerald-600">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Delivery Est.</p>
            <p className="text-[13px] font-bold text-gray-900 mt-0.5">
              ~{store.deliveryTimeMinutes || 0} Mins
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center shrink-0 text-brand">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Min Order</p>
            <p className="text-[13px] font-bold text-gray-900 mt-0.5">
              EGP {store.minimumOrderCost || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
