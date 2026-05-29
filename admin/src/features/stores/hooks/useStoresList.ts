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

export function useStoresList() {
  const { data: categories } = useMainCategories();
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const [activeSubTab, setActiveSubTab] = useState<string | undefined>(
    undefined,
  );
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

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

  const openCreateStore = () => {
    setEditingStore(null);
    setShowCreateModal(true);
  };

  const openEditStore = (store: Store, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStore(store);
    setShowCreateModal(true);
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
      isOpen: showCreateModal,
      setIsOpen: setShowCreateModal,
      editingStore,
      openCreateStore,
      openEditStore,
    },
    actions: {
      handleToggle,
      isToggling: toggleMutation.isPending,
    },
  };
}
