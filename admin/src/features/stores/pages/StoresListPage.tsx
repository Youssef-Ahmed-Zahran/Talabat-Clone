import { Plus, Search } from "lucide-react";
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import { StoreFormModal } from "../components/StoreFormModal";
import { StoresTable } from "../components/StoresTable";
import { useStoresList } from "../hooks/useStoresList";

export default function StoresListPage() {
  const {
    categories,
    activeTab,
    setActiveTab,
    activeSubTab,
    setActiveSubTab,
    search,
    setSearch,
    showCreateModal,
    setShowCreateModal,
    editingStore,
    subCategories,
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
    refetch,
    handleToggle,
    openCreateStore,
    openEditStore,
    filteredStores,
    isToggling,
  } = useStoresList();

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
            isToggling={isToggling}
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
