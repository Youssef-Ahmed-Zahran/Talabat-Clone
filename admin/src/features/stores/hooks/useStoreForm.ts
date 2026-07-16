import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useStoreDetails } from "../api/store.api";
import {
  storeSchema,
  type StoreFormValues,
} from "../../../schemas/store.schema";
import type { Store } from "../../../types";

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

export function useStoreForm(isOpen: boolean, editingStore: Store | null) {
  const [currentStep, setCurrentStep] = useState(1);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Fetch full details if editing, since list payload might not have storeZones or categoryId
  const { data: fullStore } = useStoreDetails(editingStore?.id ? String(editingStore.id) : undefined);
  const activeStore = fullStore || editingStore;

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setCurrentStep(1);
    }
  }

  const methods = useForm<StoreFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(storeSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      if (activeStore) {
        methods.reset({
          name: activeStore.name || "",
          description: activeStore.description || "",
          legalName: activeStore.legalName || "",
          phone: activeStore.phone || "",
          email: activeStore.email || "",
          address: activeStore.address || "",
          latitude: activeStore.latitude || "30.0444",
          longitude: activeStore.longitude || "31.2357",
          zoneId: activeStore.storeZones?.[0]?.zoneId ?? "",
          mainCategoryId: activeStore.categoryId
            ? String(activeStore.categoryId)
            : activeStore.mainCategory?.id
              ? String(activeStore.mainCategory.id)
              : "",
          storeType: activeStore.storeType || "",
          deliveryType:
            (activeStore.deliveryType as StoreFormValues["deliveryType"]) ||
            "TALABAT_DELIVERY",
          openTime: activeStore.openTime || "09:00",
          closeTime: activeStore.closeTime || "22:00",
          deliveryTimeMinutes: activeStore.deliveryTimeMinutes || 30,
          minimumOrderCost: Number(activeStore.minimumOrderCost) || 50,
          deliveryFees: Number(activeStore.deliveryFees) || 15,
          allowPreorder: activeStore.allowPreorder ?? true,
          ownerEmail: "",
          ownerPassword: "",
          logoUrl: activeStore.logoUrl || "",
          coverImage: activeStore.coverUrl || activeStore.coverImage || "",
          maxDeliveryDistanceKm:
            Number(activeStore.maxDeliveryDistanceKm) || 15,
          outsideZoneDeliveryFees:
            Number(activeStore.outsideZoneDeliveryFees) || 50,
          commissionRate: Number(activeStore.commissionRate) || 15,
        });
      } else {
        methods.reset(defaultValues);
      }
    }
  }, [isOpen, activeStore, methods]);


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
      fieldsToValidate.length > 0 ? await methods.trigger(fieldsToValidate) : true;

    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, editingStore ? 4 : 5));
    } else {
      toast.error("Please fill in all required fields for this step.");
    }
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return {
    form: methods,
    wizard: {
      currentStep,
      handleNext,
      handleBack,
      isLastStep: currentStep >= (editingStore ? 4 : 5),
    }
  };
}
