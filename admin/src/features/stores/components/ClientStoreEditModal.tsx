import { Loader2, Check, Image as ImageIcon, Upload, X } from "lucide-react";
import type { Store } from "../../../types";
import { useClientStoreEditForm } from "../hooks/useClientStoreEditForm";

interface ClientStoreEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: Store;
}

export function ClientStoreEditModal({
  isOpen,
  onClose,
  store,
}: ClientStoreEditModalProps) {
  const { form, state } = useClientStoreEditForm(store, isOpen, onClose);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[600px] bg-white shadow-2xl flex flex-col animate-slide-left">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Store Settings</h2>
            <p className="text-sm text-gray-500">
              Update your store's information
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form
            id="client-edit-store-form"
            onSubmit={form.handleSubmit(form.onSubmit)}
            className="space-y-8"
          >
            {/* Branding Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Branding
              </h3>
              <div className="relative h-48 w-full border-2 border-dashed border-gray-200 rounded-3xl overflow-visible group pb-8">
                <div className="absolute inset-0 rounded-3xl overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="client-edit-cover-upload"
                    onChange={(e) => state.handleFileChange(e, "coverImage")}
                  />
                  <label
                    htmlFor="client-edit-cover-upload"
                    className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 transition-all"
                  >
                    {state.coverImage ? (
                      <img
                        src={state.coverImage}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-1 group-hover:text-brand transition-colors" />
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          Select Cover Image
                        </span>
                      </div>
                    )}
                  </label>
                </div>

                <div className="absolute -bottom-10 left-8 z-10">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="client-edit-logo-upload"
                    onChange={(e) => state.handleFileChange(e, "logoUrl")}
                  />
                  <label
                    htmlFor="client-edit-logo-upload"
                    className="block relative w-20 h-20 bg-white rounded-2xl border-4 border-white shadow-xl cursor-pointer hover:scale-105 transition-transform overflow-hidden"
                  >
                    {state.logoUrl ? (
                      <img
                        src={state.logoUrl}
                        className="w-full h-full object-contain p-1.5"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-1">
                        <Upload className="w-5 h-5 text-gray-300" />
                        <span className="text-[9px] text-gray-300 font-bold uppercase tracking-wider">
                          Logo
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                      <Upload className="w-4 h-4 text-white" />
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* General Info */}
            <div className="space-y-4 pt-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                General Info
              </h3>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
                  Store Name
                </label>
                <input
                  {...form.register("name")}
                  className={`w-full px-4 py-3 bg-gray-50 border ${form.errors.name ? "border-red-500" : "border-gray-100"} rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none`}
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
                  Description
                </label>
                <textarea
                  {...form.register("description")}
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
                    Phone
                  </label>
                  <input
                    {...form.register("phone")}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
                    Email
                  </label>
                  <input
                    {...form.register("email")}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Operations */}
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
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="client-edit-store-form"
            disabled={state.isPending}
            className="inline-flex items-center gap-2 px-8 py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-dark transition-all shadow-md shadow-brand/10 disabled:opacity-70"
          >
            {state.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}
