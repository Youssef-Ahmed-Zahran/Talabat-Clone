import { useClearTimeout } from "../../../hooks/useClearTimeout";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, Navigation, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  storeSchema,
  type StoreFormValues,
} from "../../../schemas/store.schema";
import type { Category, Store } from "../../../types";
import { LocationPicker } from "./LocationPicker";
import { useCreateStore, useUpdateStore } from "../api/store.api";
import { handleApiError } from "../../../utils/error";

interface StoreFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStore: Store | null;
  categories?: Category[];
}

const defaultValues: StoreFormValues = {
  name: "",
  description: "",
  legalName: "",
  phone: "",
  email: "",
  address: "",
  latitude: "",
  longitude: "",
  mainCategoryId: "",
  storeType: "",
  deliveryType: "",
  openTime: "09:00",
  closeTime: "22:00",
  deliveryTimeMinutes: 30,
  minimumOrderCost: 50,
  deliveryFees: 15,
  allowPreorder: true,
  ownerEmail: "",
  ownerPassword: "",
  logoUrl: "",
  coverImage: "",
};

export function StoreFormModal({
  isOpen,
  onClose,
  editingStore,
  categories,
}: StoreFormModalProps) {
  // ✅ Moved down: mutations now live here, not in the parent page
  const createMutation = useCreateStore();
  const updateMutation = useUpdateStore();
  const isPending = createMutation.isPending || updateMutation.isPending;

  useClearTimeout(onClose, isOpen);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    values: editingStore
      ? {
          name: editingStore.name || "",
          description: editingStore.description || "",
          legalName: editingStore.legalName || "",
          phone: editingStore.phone || "",
          email: editingStore.email || "",
          address: editingStore.address || "",
          latitude: editingStore.latitude || "30.0444",
          longitude: editingStore.longitude || "31.2357",
          mainCategoryId: editingStore.categoryId
            ? String(editingStore.categoryId)
            : "",
          storeType: editingStore.storeType || "",
          deliveryType:
            (editingStore.deliveryType as StoreFormValues["deliveryType"]) ||
            "",
          openTime: editingStore.openTime || "09:00",
          closeTime: editingStore.closeTime || "22:00",
          deliveryTimeMinutes: editingStore.deliveryTimeMinutes || 30,
          minimumOrderCost: Number(editingStore.minimumOrderCost) || 50,
          deliveryFees: Number(editingStore.deliveryFees) || 15,
          allowPreorder: editingStore.allowPreorder ?? true,
          ownerEmail: "",
          ownerPassword: "",
          logoUrl: editingStore.logoUrl || "",
          coverImage: editingStore.coverImage || "",
        }
      : defaultValues,
  });

  const logoUrl = watch("logoUrl");
  const coverImage = watch("coverImage");
  const lat = watch("latitude");
  const lng = watch("longitude");

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "logoUrl" | "coverImage",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue(fieldName, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    const toastId = toast.loading("Locating...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("latitude", position.coords.latitude.toFixed(6));
        setValue("longitude", position.coords.longitude.toFixed(6));
        toast.success("Location found!", { id: toastId });
      },
      (error) => {
        console.error(error);
        toast.error("Unable to retrieve your location", { id: toastId });
      },
      { enableHighAccuracy: true },
    );
  };

  // ✅ Moved down: onSubmit is now fully encapsulated inside the modal
  const onSubmit = (data: StoreFormValues) => {
    if (!editingStore && (!data.ownerEmail || !data.ownerPassword)) {
      toast.error("Owner Email and Password are required for new stores");
      return;
    }

    const payload = {
      mainCategoryId: data.mainCategoryId || "",
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      legalName: data.legalName?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      email: data.email?.trim() || undefined,
      address: data.address?.trim() || undefined,
      storeType: data.storeType.toUpperCase().trim(),
      deliveryType: data.deliveryType as "TALABAT_DELIVERY" | "STORE_DELIVERY",
      openTime: data.openTime || "09:00",
      closeTime: data.closeTime || "22:00",
      deliveryTimeMinutes: Number(data.deliveryTimeMinutes),
      minimumOrderCost: Number(data.minimumOrderCost),
      deliveryFees: Number(data.deliveryFees),
      allowPreorder: data.allowPreorder ?? false,
      logo: data.logoUrl || undefined,
      cover: data.coverImage || undefined,
      cityName: "Cairo",
      countryName: "Egypt",
      countryCode: "EG",
      latitude: data.latitude?.trim() || "30.0444",
      longitude: data.longitude?.trim() || "31.2357",
    };

    if (editingStore) {
      updateMutation.mutate(
        { storeId: String(editingStore.id), payload },
        {
          onSuccess: () => {
            toast.success("Store updated successfully");
            onClose();
          },
          onError: (err: unknown) => {
            handleApiError(
              err,
              "We couldn't update the store details. Please check your information.",
            );
          },
        },
      );
    } else {
      createMutation.mutate(
        {
          ...payload,
          mainCategoryId: data.mainCategoryId
            ? String(data.mainCategoryId)
            : "",
          ownerEmail: data.ownerEmail!.trim(),
          ownerPassword: data.ownerPassword!,
        },
        {
          onSuccess: () => {
            toast.success("Store created successfully");
            onClose();
          },
          onError: (err: unknown) => {
            handleApiError(
              err,
              "We couldn't create the new store. Please try again.",
            );
          },
        },
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200/80 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 animate-slide-up">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {editingStore ? "Edit Store" : "Create New Store"}
        </h2>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5"
        >
          <div className="md:col-span-2 pb-2 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Branding &amp; Media
            </h3>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Store Logo
                </label>
                <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl hover:border-brand/50 hover:bg-brand/5 transition-colors cursor-pointer group relative overflow-hidden bg-gray-50/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "logoUrl")}
                    className="hidden"
                  />
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-5 h-5 text-gray-400 group-hover:text-brand mb-1" />
                      <span className="text-[11px] text-gray-500 font-medium">
                        Upload Logo
                      </span>
                    </div>
                  )}
                </label>
              </div>
              <div className="flex-1">
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Store Cover
                </label>
                <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl hover:border-brand/50 hover:bg-brand/5 transition-colors cursor-pointer group relative overflow-hidden bg-gray-50/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "coverImage")}
                    className="hidden"
                  />
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-5 h-5 text-gray-400 group-hover:text-brand mb-1" />
                      <span className="text-[11px] text-gray-500 font-medium">
                        Upload Cover
                      </span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {!editingStore && (
            <div className="md:col-span-2 pb-2 border-b border-gray-100 mt-2">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Store Owner (Initial Credentials)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                    Owner Email *
                  </label>
                  <input
                    type="email"
                    {...register("ownerEmail")}
                    placeholder="owner@example.com"
                    className={`w-full px-4 py-2.5 text-sm bg-white border ${errors.ownerEmail ? "border-red-500" : "border-gray-200"} rounded-xl placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all`}
                  />
                  {errors.ownerEmail && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.ownerEmail.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                    Initial Password *
                  </label>
                  <input
                    type="text"
                    {...register("ownerPassword")}
                    placeholder="Secure password..."
                    className={`w-full px-4 py-2.5 text-sm bg-white border ${errors.ownerPassword ? "border-red-500" : "border-gray-200"} rounded-xl placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all`}
                  />
                  {errors.ownerPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.ownerPassword.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="md:col-span-2 mt-2">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Store Information
            </h3>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Store Name *
            </label>
            <input
              type="text"
              {...register("name")}
              placeholder="e.g. El-Shrook"
              className={`w-full px-4 py-2.5 text-sm bg-gray-50/50 border ${errors.name ? "border-red-500" : "border-gray-200"} rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Legal Name
            </label>
            <input
              type="text"
              {...register("legalName")}
              placeholder="e.g. El-Shrook LLC"
              className="w-full px-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              {...register("phone")}
              placeholder="+201xxxxxxxxx"
              className="w-full px-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Store Email
            </label>
            <input
              type="email"
              {...register("email")}
              placeholder="contact@store.com"
              className="w-full px-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
            />
          </div>

          <div className="col-span-1 sm:col-span-2">
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Physical Address
            </label>
            <textarea
              {...register("address")}
              placeholder="123 Example Street, City Center..."
              rows={2}
              className="w-full px-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none"
            />
          </div>

          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[13px] font-medium text-gray-700">
                Store Location (Click on the map to set)
              </label>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-brand bg-brand/5 hover:bg-brand/10 rounded-lg transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                Use My Current Location
              </button>
            </div>
            <div className="mb-3">
              <LocationPicker
                latitude={lat || "30.0444"}
                longitude={lng || "31.2357"}
                onChange={(nLat, nLng, address) => {
                  setValue("latitude", nLat);
                  setValue("longitude", nLng);
                  if (address) {
                    setValue("address", address);
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wider">
                  Latitude
                </label>
                <input
                  type="text"
                  {...register("latitude")}
                  placeholder="e.g. 30.0444"
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wider">
                  Longitude
                </label>
                <input
                  type="text"
                  {...register("longitude")}
                  placeholder="e.g. 31.2357"
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Main Category *
            </label>
            <select
              {...register("mainCategoryId")}
              className={`w-full px-4 py-2.5 text-sm bg-gray-50/50 border ${errors.mainCategoryId ? "border-red-500" : "border-gray-200"} rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`}
            >
              <option value="">Select category…</option>
              {categories?.map((cat: Category) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.mainCategoryId && (
              <p className="text-red-500 text-xs mt-1">
                {errors.mainCategoryId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Store Type *
            </label>
            <input
              type="text"
              {...register("storeType")}
              placeholder="e.g. RESTAURANT, ELECTRONICS..."
              className={`w-full px-4 py-2.5 text-sm bg-gray-50/50 border ${errors.storeType ? "border-red-500" : "border-gray-200"} rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`}
            />
            {errors.storeType && (
              <p className="text-red-500 text-xs mt-1">
                {errors.storeType.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={2}
              placeholder="Brief store description..."
              className="w-full px-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none"
            />
          </div>

          <div className="md:col-span-2 mt-2 pt-2 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Operations &amp; Delivery
            </h3>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Delivery Type *
            </label>
            <select
              {...register("deliveryType")}
              className={`w-full px-4 py-2.5 text-sm bg-gray-50/50 border ${errors.deliveryType ? "border-red-500" : "border-gray-200"} rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`}
            >
              <option value="">Select delivery type...</option>
              <option value="TALABAT_DELIVERY">Platform Delivery</option>
              <option value="STORE_DELIVERY">Store Delivery</option>
            </select>
            {errors.deliveryType && (
              <p className="text-red-500 text-xs mt-1">
                {errors.deliveryType.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Delivery Time (mins)
            </label>
            <input
              type="number"
              {...register("deliveryTimeMinutes", { valueAsNumber: true })}
              placeholder="30"
              className="w-full px-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Opening Time
              </label>
              <input
                type="time"
                {...register("openTime")}
                className="w-full px-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Closing Time
              </label>
              <input
                type="time"
                {...register("closeTime")}
                className="w-full px-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Min Order (EGP)
            </label>
            <input
              type="number"
              {...register("minimumOrderCost", { valueAsNumber: true })}
              placeholder="50"
              className="w-full px-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Delivery Fees
            </label>
            <input
              type="number"
              {...register("deliveryFees", { valueAsNumber: true })}
              placeholder="15"
              className="w-full px-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allowPreorder"
              {...register("allowPreorder")}
              className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
            />
            <label
              htmlFor="allowPreorder"
              className="text-[13px] font-medium text-gray-700"
            >
              Allow Pre-orders
            </label>
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-8 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-colors shadow-sm disabled:opacity-70"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingStore ? "Update Store" : "Create Store"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
