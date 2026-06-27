import { useFormContext } from "react-hook-form";
import type { StoreFormValues } from "../../../../schemas/store.schema";

export function OperationsStep() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<StoreFormValues>();

  const deliveryType = watch("deliveryType");

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Open Time
          </label>
          <input
            type="time"
            {...register("openTime")}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl"
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Close Time
          </label>
          <input
            type="time"
            {...register("closeTime")}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Delivery Time (min) *
          </label>
          <input
            type="number"
            {...register("deliveryTimeMinutes")}
            className={`w-full px-4 py-3 bg-gray-50 border ${errors.deliveryTimeMinutes ? "border-red-500" : "border-gray-100"} rounded-2xl`}
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Min Order (EGP) *
          </label>
          <input
            type="number"
            {...register("minimumOrderCost")}
            className={`w-full px-4 py-3 bg-gray-50 border ${errors.minimumOrderCost ? "border-red-500" : "border-gray-100"} rounded-2xl`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Delivery Fees *
          </label>
          <input
            type="number"
            {...register("deliveryFees")}
            className={`w-full px-4 py-3 bg-gray-50 border ${errors.deliveryFees ? "border-red-500" : "border-gray-100"} rounded-2xl`}
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Commission (%) *
          </label>
          <input
            type="number"
            step="0.1"
            {...register("commissionRate")}
            className={`w-full px-4 py-3 bg-gray-50 border ${errors.commissionRate ? "border-red-500" : "border-gray-100"} rounded-2xl`}
          />
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-900">Pre-orders</p>
          <p className="text-[11px] text-gray-500">
            Allow customers to order when closed
          </p>
        </div>
        <input
          type="checkbox"
          {...register("allowPreorder")}
          className="w-5 h-5 rounded text-brand focus:ring-brand"
        />
      </div>

      <div>
        <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
          Delivery Strategy
        </label>
        <select
          {...register("deliveryType")}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl appearance-none"
        >
          <option value="TALABAT_DELIVERY">Talabat Fleet (Partner)</option>
          <option value="STORE_DELIVERY">Self Delivery</option>
        </select>
      </div>

      {deliveryType === "STORE_DELIVERY" && (
        <div className="space-y-4 animate-slide-up">
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
              Max Delivery Distance (KM) *
            </label>
            <input
              type="number"
              {...register("maxDeliveryDistanceKm")}
              className={`w-full px-4 py-3 bg-gray-50 border ${errors.maxDeliveryDistanceKm ? "border-red-500" : "border-gray-100"} rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all`}
            />
            <p className="mt-1.5 text-[11px] text-gray-500 ml-1">
              Maximum radius this store's drivers will travel outside their
              location.
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
              Outside Zone Delivery Fee (EGP) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold pointer-events-none">
                EGP
              </span>
              <input
                type="number"
                {...register("outsideZoneDeliveryFees", {
                  valueAsNumber: true,
                })}
                placeholder="0"
                className={`w-full pl-14 pr-4 py-3 bg-gray-50 border ${errors.outsideZoneDeliveryFees ? "border-red-500" : "border-gray-100"} rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all`}
              />
            </div>
            {errors.outsideZoneDeliveryFees && (
              <p className="text-red-500 text-[11px] mt-1 ml-2 font-medium">
                {errors.outsideZoneDeliveryFees.message}
              </p>
            )}
            <p className="mt-1.5 text-[11px] text-gray-500 ml-1">
              Extra fee charged to customers when the delivery address falls
              outside the store's assigned zone.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
