import { useState } from "react";
import toast from "react-hot-toast";
import { useStores, useToggleStoreStatus } from "../api/store.api";
import { useDebounce } from "../../../hooks/useDebouncing";
import {
  useMainCategories,
  useSubCategories,
} from "../../categories/api/category.api";
import type { Store } from "../../../types";
import { handleApiError } from "../../../utils/error";
import { useCreateStore, useUpdateStore } from "../api/store.api";
import type { StoreFormValues } from "../../../schemas/store.schema";
import type { CreateStorePayload } from "../../../types";

export function useStoresList() {
  const { data: categories } = useMainCategories();
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const [activeSubTab, setActiveSubTab] = useState<string | undefined>(
    undefined,
  );
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  type ModalState =
    | { type: "NONE" }
    | { type: "CREATE" }
    | { type: "EDIT"; store: Store };

  const [modalState, setModalState] = useState<ModalState>({ type: "NONE" });

  const closeModal = () => setModalState({ type: "NONE" });

  const { data: subCategories } = useSubCategories(activeTab || "");
  const {
    data: storesData,
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
    refetch,
  } = useStores({ mainCategoryId: activeTab, subCategoryId: activeSubTab });

  const toggleMutation = useToggleStoreStatus();
  const createMutation = useCreateStore();
  const updateMutation = useUpdateStore();

  const handleToggle = (storeId: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMutation.mutate(storeId.toString(), {
      onSuccess: () => toast.success("Store status updated"),
      onError: (err) =>
        handleApiError(
          err,
          "We couldn't update the store status. Please try again.",
        ),
    });
  };

  const openCreateStore = () => setModalState({ type: "CREATE" });

  const openEditStore = (store: Store, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalState({ type: "EDIT", store });
  };

  const handleSubmit = (data: StoreFormValues, selectedZoneId: string) => {
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

    if (modalState.type === "EDIT") {
      updateMutation.mutate(
        { storeId: String(modalState.store.id), payload },
        {
          onSuccess: () => {
            toast.success("Store updated successfully");
            closeModal();
          },
          onError: (err) =>
            handleApiError(err, "We couldn't update the store."),
        },
      );
    } else if (modalState.type === "CREATE") {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Store created successfully");
          closeModal();
        },
        onError: (err) => handleApiError(err, "We couldn't create the store."),
      });
    }
  };

  const filteredStores = storesData?.stores?.filter((s: Store) =>
    (s.name || "").toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  return {
    filters: {
      activeTab,
      setActiveTab,
      activeSubTab,
      setActiveSubTab,
      search,
      setSearch,
    },
    query: {
      categories,
      subCategories,
      stores: filteredStores,
      isLoading,
      isFetching,
      isPlaceholderData,
      isError,
      refetch,
    },
    modal: {
      state: modalState,
      close: closeModal,
      openCreateStore,
      openEditStore,
    },
    actions: {
      submit: handleSubmit,
      isPending: createMutation.isPending || updateMutation.isPending,
      handleToggle,
      isToggling: toggleMutation.isPending,
    },
  };
}
