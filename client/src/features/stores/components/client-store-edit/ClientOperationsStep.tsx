import type { Store } from "../../../../types";
import { useClientStoreEditForm } from "../../hooks/useClientStoreEditForm";

type ClientStoreEditForm = ReturnType<typeof useClientStoreEditForm>["form"];

interface ClientOperationsStepProps {
  form: ClientStoreEditForm;
  store: Store;
}

export function ClientOperationsStep({
  form,
  store,
}: ClientOperationsStepProps) {
  return (
    <div className="space-y-4 pt-4">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
        Standard Hours
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Open Time
          </label>
          <input
            type="time"
            {...form.register("openTime")}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl"
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Close Time
          </label>
          <input
            type="time"
            {...form.register("closeTime")}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl"
          />
        </div>
      </div>

      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide pt-2">
        Overtime (Optional)
      </h3>
      <p className="text-[11px] text-gray-500">
        Add secondary operating hours after your store closes.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Overtime Opens
          </label>
          <input
            type="time"
            {...form.register("overtimeOpenTime")}
            className="w-full px-4 py-3 bg-brand/5 border border-brand/20 rounded-2xl text-brand-dark"
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Overtime Closes
          </label>
          <input
            type="time"
            {...form.register("overtimeCloseTime")}
            className="w-full px-4 py-3 bg-brand/5 border border-brand/20 rounded-2xl text-brand-dark"
          />
        </div>
      </div>

      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide pt-4">
        Delivery Settings
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Delivery Time (min)
          </label>
          <input
            type="number"
            {...form.register("deliveryTimeMinutes")}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl"
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Min Order (EGP)
          </label>
          <input
            type="number"
            {...form.register("minimumOrderCost")}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Delivery Fees
          </label>
          <input
            type="number"
            {...form.register("deliveryFees")}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl"
          />
        </div>
        {store.deliveryType === "STORE_DELIVERY" && (
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
              Max Distance (KM)
            </label>
            <input
              type="number"
              {...form.register("maxDeliveryDistanceKm")}
              className={`w-full px-4 py-3 bg-gray-50 border ${form.errors.maxDeliveryDistanceKm ? "border-red-500" : "border-gray-100"} rounded-2xl`}
            />
            {form.errors.maxDeliveryDistanceKm && (
              <span className="text-red-500 text-[10px] ml-1">
                {form.errors.maxDeliveryDistanceKm.message}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col justify-center">
          <div className="p-3 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100">
            <span className="text-[13px] font-bold text-gray-700">
              Pre-orders allowed
            </span>
            <input
              type="checkbox"
              {...form.register("allowPreorder")}
              className="w-5 h-5 rounded text-brand focus:ring-brand"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
