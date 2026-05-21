import { Plus, Layers3, ChevronRight, LayoutGrid } from "lucide-react";
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import SubCategoriesTable from "../components/SubCategoriesTable";
import CategoryModal from "../components/CategoryModal";
import SubCategoryModal from "../components/SubCategoryModal";
import { useMainCategoriesPage } from "../hooks/useMainCategoriesPage";

export default function MainCategoriesPage() {
  const {
    categories,
    isLoading,
    isError,
    refetch,
    selectedCategoryId,
    setSelectedCategoryId,
    subCategories,
    subLoading,
    showMainModal,
    setShowMainModal,
    showSubModal,
    setShowSubModal,
    selectedCategory,
  } = useMainCategoriesPage();

  if (isLoading && !categories) return <PageLoader />;
  if (isError) return <ErrorFallback onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Category Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your marketplace hierarchy in one place
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMainModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Main Category
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
        {/* ── Main Categories List (Left) ────────────────────────────── */}
        <div className="w-full lg:w-[400px] shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-50 bg-gray-50/30">
              <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider">
                Main Categories
              </h2>
            </div>
            <div className="divide-y divide-gray-50 max-h-[700px] overflow-y-auto">
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`w-full flex items-center justify-between p-4 text-left transition-all group ${
                    selectedCategoryId === cat.id
                      ? "bg-brand/5"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border ${selectedCategoryId === cat.id ? "border-brand/20 bg-white" : "border-gray-100 bg-gray-50"}`}
                    >
                      {cat.imageUrl || cat.image ? (
                        <img
                          src={cat.imageUrl || cat.image}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Layers3
                          className={`w-5 h-5 ${selectedCategoryId === cat.id ? "text-brand" : "text-gray-400"}`}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-bold truncate ${selectedCategoryId === cat.id ? "text-brand" : "text-gray-900"}`}
                      >
                        {cat.name}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {cat.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${selectedCategoryId === cat.id ? "text-brand translate-x-1" : "text-gray-300 group-hover:text-gray-400"}`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Sub-Categories Content (Right) ────────────────────────── */}
        <div className="flex-1 min-w-0">
          {selectedCategoryId ? (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {selectedCategory?.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Sub-categories under this group
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSubModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Sub
                </button>
              </div>

              {subLoading ? (
                <div className="py-20 flex justify-center">
                  <PageLoader />
                </div>
              ) : (
                <SubCategoriesTable
                  subCategories={subCategories ?? []}
                  categoryId={selectedCategoryId}
                />
              )}
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                <Layers3 className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-sm font-bold text-gray-600">
                No Category Selected
              </h3>
              <p className="text-[13px] text-gray-400 mt-1 max-w-[240px]">
                Select a main category from the left to manage its
                sub-categories.
              </p>
            </div>
          )}
        </div>
      </div>

      {showMainModal && (
        <CategoryModal
          isOpen={true}
          editingCategory={null}
          onClose={() => setShowMainModal(false)}
        />
      )}

      {showSubModal && selectedCategoryId && (
        <SubCategoryModal
          isOpen={true}
          categoryId={selectedCategoryId}
          editingSub={null}
          onClose={() => setShowSubModal(false)}
        />
      )}
    </div>
  );
}
