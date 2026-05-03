import { useState } from "react";
import { Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { useStores, useToggleStoreStatus } from "../api/store.api";
import { useDebounce } from "../../../hooks/useDebouncing";
import {
  useMainCategories,
  useSubCategories,
} from "../../categories/api/category.api";
import type { Store } from "../../../types";
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import { StoreFormModal } from "../components/StoreFormModal";
import { StoresTable } from "../components/StoresTable";
import { StoreCategoryTabs } from "../components/StoreCategoryTabs";
import { handleApiError } from "../../../utils/error";

export default function StoresListPage() {
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

  // Only show full page loader on initial mount if categories aren't ready
  if (isLoading && !categories) return <PageLoader />;
  if (isError) return <ErrorFallback onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Stores
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all vendor stores across categories
          </p>
        </div>
        <button
          onClick={openCreateStore}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Store
        </button>
      </div>

      <StoreCategoryTabs
        categories={categories}
        activeTab={activeTab}
        onTabChange={(id) => {
          setActiveTab(id);
          setActiveSubTab(undefined);
        }}
        subCategories={subCategories}
        activeSubTab={activeSubTab}
        onSubTabChange={setActiveSubTab}
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stores…"
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl placeholder:text-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
        />
      </div>

      <StoresTable
        stores={filteredStores}
        onToggleStatus={handleToggle}
        onEdit={openEditStore}
        isToggling={toggleMutation.isPending}
        isLoading={isFetching || isPlaceholderData}
      />

      <StoreFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        editingStore={editingStore}
        categories={categories}
      />
    </div>
  );
}
