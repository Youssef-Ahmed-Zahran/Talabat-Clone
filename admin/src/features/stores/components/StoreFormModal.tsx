import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Upload,
  Navigation,
  Loader2,
  MapPin,
  Check,
  Building2,
  Image as ImageIcon,
  Clock,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  storeSchema,
  type StoreFormValues,
} from "../../../schemas/store.schema";
import type { Category, Store, CreateStorePayload } from "../../../types";
import { LocationPicker } from "./LocationPicker";
import { useCreateStore, useUpdateStore } from "../api/store.api";
import { handleApiError } from "../../../utils/error";
import { fetchAllZones, type Zone } from "../../zones/api/zones.api";
import { SlideOver } from "../../../components/layout/SlideOver";

interface StoreFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStore: Store | null;
  categories?: Category[];
}

const steps = [
  { id: 1, name: "General Info", icon: Building2 },
  { id: 2, name: "Branding", icon: ImageIcon },
  { id: 3, name: "Location", icon: MapPin },
  { id: 4, name: "Operations", icon: Clock },
  { id: 5, name: "Owner Account", icon: ShieldCheck },
];

const defaultValues: StoreFormValues = {
  name: "",
  description: "",
  legalName: "",
  phone: "",
  email: "",
  address: "",
  latitude: "30.0444",
  longitude: "31.2357",
  mainCategoryId: "",
  storeType: "",
  deliveryType: "TALABAT_DELIVERY",
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
  maxDeliveryDistanceKm: 15,
  outsideZoneDeliveryFees: 50,
  commissionRate: 15,
};

export function StoreFormModal({
  isOpen,
  onClose,
  editingStore,
  categories,
}: StoreFormModalProps) {
  const createMutation = useCreateStore();
  const updateMutation = useUpdateStore();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [currentStep, setCurrentStep] = useState(1);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchAllZones()
        .then(setZones)
        .catch(() => {});
      setCurrentStep(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingStore?.storeZones?.[0]?.zoneId) {
      setSelectedZoneId(editingStore.storeZones[0].zoneId);
    } else {
      setSelectedZoneId("");
    }
  }, [editingStore]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
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
            "TALABAT_DELIVERY",
          openTime: editingStore.openTime || "09:00",
          closeTime: editingStore.closeTime || "22:00",
          deliveryTimeMinutes: editingStore.deliveryTimeMinutes || 30,
          minimumOrderCost: Number(editingStore.minimumOrderCost) || 50,
          deliveryFees: Number(editingStore.deliveryFees) || 15,
          allowPreorder: editingStore.allowPreorder ?? true,
          ownerEmail: "",
          ownerPassword: "",
          logoUrl: editingStore.logoUrl || "",
          coverImage: editingStore.coverUrl || editingStore.coverImage || "",
          maxDeliveryDistanceKm:
            Number(editingStore.maxDeliveryDistanceKm) || 15,
          outsideZoneDeliveryFees:
            Number(editingStore.outsideZoneDeliveryFees) || 50,
          commissionRate: Number(editingStore.commissionRate) || 15,
        }
      : defaultValues,
  });

  const logoUrl = watch("logoUrl");
  const coverImage = watch("coverImage");
  const lat = watch("latitude");
  const lng = watch("longitude");

  const handleNext = async () => {
    let fieldsToValidate: (keyof StoreFormValues)[] = [];
    if (currentStep === 1)
      fieldsToValidate = ["name", "mainCategoryId", "storeType"];
    if (currentStep === 2) fieldsToValidate = []; // Media is optional but encouraged
    if (currentStep === 3)
      fieldsToValidate = ["address", "latitude", "longitude"];
    if (currentStep === 4)
      fieldsToValidate = [
        "deliveryTimeMinutes",
        "minimumOrderCost",
        "deliveryFees",
        "commissionRate",
      ];
    if (currentStep === 5 && !editingStore)
      fieldsToValidate = ["ownerEmail", "ownerPassword"];

    const isStepValid =
      fieldsToValidate.length > 0 ? await trigger(fieldsToValidate) : true;

    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, editingStore ? 4 : 5));
    } else {
      toast.error("Please fill in all required fields for this step.");
    }
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "logoUrl" | "coverImage",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setValue(fieldName, reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: StoreFormValues) => {
    const payload: CreateStorePayload = {
      ...data,
      mainCategoryId: data.mainCategoryId,
      deliveryType: (data.deliveryType || "TALABAT_DELIVERY") as
        | "TALABAT_DELIVERY"
        | "STORE_DELIVERY",
      cityName: "Cairo",
      countryName: "Egypt",
      countryCode: "EG",
      openTime: data.openTime || "09:00",
      closeTime: data.closeTime || "23:00",
      deliveryTimeMinutes: data.deliveryTimeMinutes || 30,
      minimumOrderCost: data.minimumOrderCost || 0,
      deliveryFees: data.deliveryFees || 0,
      allowPreorder: data.allowPreorder ?? true,
      ownerEmail: data.ownerEmail || "",
      latitude: data.latitude || "0",
      longitude: data.longitude || "0",
      logo: data.logoUrl,
      cover: data.coverImage,
      zoneId: selectedZoneId || undefined,
    };

    if (editingStore) {
      updateMutation.mutate(
        { storeId: String(editingStore.id), payload },
        {
          onSuccess: () => {
            toast.success("Store updated successfully");
            onClose();
          },
          onError: (err) =>
            handleApiError(err, "We couldn't update the store."),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Store created successfully");
          onClose();
        },
        onError: (err) => handleApiError(err, "We couldn't create the store."),
      });
    }
  };

  const currentSteps = editingStore ? steps.filter((s) => s.id !== 5) : steps;

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={editingStore ? "Edit Store" : "Create Store"}
      description="Manage vendor registration and operational details."
      footer={
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={currentStep === 1 ? onClose : handleBack}
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 px-4"
          >
            {currentStep === 1 ? "Cancel" : "Back"}
          </button>

          <div className="flex items-center gap-3">
            {currentStep < (editingStore ? 4 : 5) ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-dark transition-all shadow-md shadow-brand/10"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-8 py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-dark transition-all shadow-md shadow-brand/10 disabled:opacity-70"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editingStore ? "Save Changes" : "Create Store"}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Progress Tracker */}
        <div className="flex items-center justify-between px-2">
          {currentSteps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`
                flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-all duration-300
                ${
                  currentStep === step.id
                    ? "bg-brand text-white ring-4 ring-brand/10"
                    : currentStep > step.id
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 text-gray-400"
                }
              `}
              >
                {currentStep > step.id ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
              </div>
              {idx < currentSteps.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-2 ${currentStep > step.id ? "bg-emerald-500" : "bg-gray-100"}`}
                />
              )}
            </div>
          ))}
        </div>

        <form className="animate-fade-in" onSubmit={(e) => e.preventDefault()}>
          {/* STEP 1: GENERAL INFO */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-slide-up">
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
                    Store Name *
                  </label>
                  <input
                    {...register("name")}
                    placeholder="e.g. Buffalo Burger"
                    className={`w-full px-4 py-3 bg-gray-50 border ${errors.name ? "border-red-500" : "border-gray-100"} rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-[11px] mt-1 ml-2 font-medium">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
                    Legal Entity Name
                  </label>
                  <input
                    {...register("legalName")}
                    placeholder="e.g. Buffalo Foods LLC"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
                      Phone
                    </label>
                    <input
                      {...register("phone")}
                      placeholder="+201..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
                      Email
                    </label>
                    <input
                      {...register("email")}
                      placeholder="store@email.com"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
                    Category *
                  </label>
                  <select
                    {...register("mainCategoryId")}
                    className={`w-full px-4 py-3 bg-gray-50 border ${errors.mainCategoryId ? "border-red-500" : "border-gray-100"} rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all appearance-none`}
                  >
                    <option value="">Select category...</option>
                    {categories?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
                    Store Type *
                  </label>
                  <input
                    {...register("storeType")}
                    placeholder="e.g. RESTAURANT"
                    className={`w-full px-4 py-3 bg-gray-50 border ${errors.storeType ? "border-red-500" : "border-gray-100"} rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BRANDING (RE-DESIGNED) */}
          {currentStep === 2 && (
            <div className="space-y-8 animate-slide-up">
              <div className="relative">
                <label className="block text-[13px] font-bold text-gray-700 mb-3 ml-1">
                  Store Branding
                </label>
                {/* Cover + Logo card — pb-8 reserves space so logo isn't clipped */}
                <div className="relative h-48 w-full border-2 border-dashed border-gray-200 rounded-3xl overflow-visible group pb-8">
                  <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="cover-upload"
                      onChange={(e) => handleFileChange(e, "coverImage")}
                    />
                    <label
                      htmlFor="cover-upload"
                      className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 transition-all"
                    >
                      {coverImage ? (
                        <img
                          src={coverImage}
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

                  {/* Logo Overlap — sits outside the clipping boundary */}
                  <div className="absolute -bottom-10 left-8 z-10">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="logo-upload"
                      onChange={(e) => handleFileChange(e, "logoUrl")}
                    />
                    <label
                      htmlFor="logo-upload"
                      className="block relative w-20 h-20 bg-white rounded-2xl border-4 border-white shadow-xl cursor-pointer hover:scale-105 transition-transform overflow-hidden"
                    >
                      {logoUrl ? (
                        <img
                          src={logoUrl}
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
                <p className="mt-14 text-[11px] text-gray-400 font-medium px-1">
                  Upload your store's brand identity. Click the banner to set a
                  cover, and the logo card to set an icon.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: LOCATION */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-slide-up">
              <div className="space-y-4">
                <div className="h-[300px] rounded-3xl overflow-hidden border border-gray-100 shadow-inner">
                  <LocationPicker
                    latitude={lat}
                    longitude={lng}
                    onChange={(nLat, nLng, addr) => {
                      setValue("latitude", nLat);
                      setValue("longitude", nLng);
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
          )}

          {/* STEP 4: OPERATIONS */}
          {currentStep === 4 && (
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
                  <option value="TALABAT_DELIVERY">
                    Talabat Fleet (Partner)
                  </option>
                  <option value="STORE_DELIVERY">Self Delivery</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 5: OWNER ACCOUNT */}
          {currentStep === 5 && !editingStore && (
            <div className="space-y-6 animate-slide-up">
              <div className="p-5 bg-brand/5 border border-brand/10 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="w-6 h-6 text-brand" />
                  <h3 className="text-sm font-bold text-brand">
                    Secure Owner Portal
                  </h3>
                </div>
                <p className="text-[12px] text-gray-600 leading-relaxed">
                  Set the initial login credentials for the store owner. They
                  will use these to access their dedicated Partner Portal.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
                    Owner Email *
                  </label>
                  <input
                    {...register("ownerEmail")}
                    type="email"
                    placeholder="owner@example.com"
                    className={`w-full px-4 py-3 bg-white border ${errors.ownerEmail ? "border-red-500" : "border-gray-100"} rounded-2xl focus:ring-4 focus:ring-brand/5 outline-none transition-all`}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
                    Initial Password *
                  </label>
                  <input
                    {...register("ownerPassword")}
                    type="text"
                    placeholder="At least 6 characters"
                    className={`w-full px-4 py-3 bg-white border ${errors.ownerPassword ? "border-red-500" : "border-gray-100"} rounded-2xl focus:ring-4 focus:ring-brand/5 outline-none transition-all`}
                  />
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </SlideOver>
  );
}
