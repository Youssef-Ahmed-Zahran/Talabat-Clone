import { useState, useLayoutEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
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

type FormState = {
  currentStep: number;
  zones: { id: string; name: string }[];
  selectedZoneId: string;
};

export function useStoreForm(isOpen: boolean, editingStore: Store | null) {
  const [formState, setFormState] = useState<FormState>({
    currentStep: 1,
    zones: [],
    selectedZoneId: "",
  });

  const { currentStep, zones, selectedZoneId } = formState;

  const setCurrentStep = (step: number | ((prev: number) => number)) =>
    setFormState((prev) => ({
      ...prev,
      currentStep: typeof step === "function" ? step(prev.currentStep) : step,
    }));

  const setSelectedZoneId = (id: string) =>
    setFormState((prev) => ({ ...prev, selectedZoneId: id }));

  const methods = useForm<StoreFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(storeSchema) as any,
    defaultValues,
  });

  // useLayoutEffect runs synchronously before the browser paints, so the
  // setState call here is batched with the triggering render — no cascading
  // render cycle is produced. This is the correct escape hatch for
  // "reset on open" patterns (see React docs on useLayoutEffect).
  useLayoutEffect(() => {
    if (isOpen) {
      setFormState({
        currentStep: 1,
        zones: [],
        selectedZoneId: editingStore?.storeZones?.[0]?.zoneId ?? "",
      });
      if (editingStore) {
        methods.reset({
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
        });
      } else {
        methods.reset(defaultValues);
      }
    }
  }, [isOpen, editingStore, methods]);


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
    methods,
    currentStep,
    zones,
    selectedZoneId,
    setSelectedZoneId,
    handleNext,
    handleBack,
  };
}
