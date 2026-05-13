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

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Filter Sidebar ────────────────────────────────────────── */}
        <aside className="w-full lg:w-64 shrink-0 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Store name..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border-none rounded-xl placeholder:text-gray-400 text-gray-900 focus:ring-2 focus:ring-brand/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-1">
                Categories
              </label>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab(undefined);
                    setActiveSubTab(undefined);
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                    activeTab === undefined
                      ? "bg-brand text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  All Categories
                </button>
                {categories?.map((cat) => (
                  <div key={cat.id} className="space-y-1">
                    <button
                      onClick={() => {
                        setActiveTab(cat.id);
                        setActiveSubTab(undefined);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                        activeTab === cat.id && !activeSubTab
                          ? "bg-brand/10 text-brand"
                          : activeTab === cat.id
                            ? "text-brand font-bold"
                            : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {cat.name}
                    </button>

                    {activeTab === cat.id &&
                      subCategories &&
                      subCategories.length > 0 && (
                        <div className="ml-3 pl-3 border-l border-gray-100 space-y-1 py-1">
                          {subCategories.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => setActiveSubTab(sub.id)}
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-[12px] transition-all ${
                                activeSubTab === sub.id
                                  ? "bg-brand text-white shadow-sm font-semibold"
                                  : "text-gray-500 hover:text-brand hover:bg-brand-50"
                              }`}
                            >
                              {sub.name}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ── Table Content ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <StoresTable
            stores={filteredStores}
            onToggleStatus={handleToggle}
            onEdit={openEditStore}
            isToggling={toggleMutation.isPending}
            isLoading={isFetching || isPlaceholderData}
          />
        </div>
      </div>

      <StoreFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        editingStore={editingStore}
        categories={categories}
      />
    </div>
  );
}
