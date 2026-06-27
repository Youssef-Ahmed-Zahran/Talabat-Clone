import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Package,
  Layers3,
  Search,
  Loader2,
} from "lucide-react";
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import { SectionModal } from "../components/section/SectionModal";
import { ProductModal } from "../components/product/ProductModal";
import { ProductCard } from "../components/product/ProductCard";
import { SectionNav } from "../components/section/SectionTabs";
import { useParams } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore";
import { useSectionsManager } from "../hooks/useSectionsManager";
import { useProductsManager } from "../hooks/useProductsManager";

export default function StoreCatalogPage() {
  const params = useParams<{ storeId: string }>();
  const authStoreId = useAuthStore((s) => s.storeId);
  const role = useAuthStore((s) => s.role);
  const sid = params.storeId || authStoreId || "";

  const { filters, query, modal, actions } = useProductsManager(sid);

  // ── Drag-and-drop reorder state ──────────────────────────────
  const [orderedProducts, setOrderedProducts] = useState<
    typeof query.products | null
  >(null);
  const draggedId = useRef<string | null>(null);
  const dragOverId = useRef<string | null>(null);
  const displayedProducts = orderedProducts ?? query.products;

  const {
    query: sectionsQuery,
    modal: sectionsModal,
    actions: sectionsActions,
  } = useSectionsManager(sid, filters.activeSectionId, () =>
    filters.setActiveSectionId(null),
  );

  // ── Loading / Error ──────────────────────────────────────────
  if (sectionsQuery.isLoading && !sectionsQuery.sections) return <PageLoader />;
  if (sectionsQuery.isError)
    return <ErrorFallback onRetry={sectionsQuery.refetch} />;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to={role === "owner" ? `/my-store` : `/stores/${sid}`}
            className="p-2.5 rounded-2xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 border border-transparent hover:border-gray-200/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Store Catalog
            </h1>
            <p className="text-[13px] text-gray-400 font-medium mt-0.5">
              Manage menu sections &amp; products
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={sectionsModal.openCreate}
            className="inline-flex items-center gap-2 px-4.5 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-200/80 rounded-2xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <Layers3 className="w-4 h-4 text-brand" />
            Add Section
          </button>
          <button
            onClick={modal.openCreate}
            className="inline-flex items-center gap-2 px-4.5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand to-brand-light rounded-2xl hover:shadow-lg hover:shadow-brand/15 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Left Sidebar Navigation ────────────────────────────────── */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="sticky top-24">
            <SectionNav
              sections={sectionsQuery.sections}
              activeSectionId={filters.activeSectionId}
              onSectionChange={(id) => {
                setOrderedProducts(null);
                filters.setActiveSectionId(id);
              }}
              onEditSection={sectionsModal.openEdit}
              onDeleteSection={sectionsActions.handleDeleteSection}
            />
          </div>
        </aside>

        {/* ── Main Catalog Content ──────────────────────────────────── */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.productSearch}
                onChange={(e) => {
                  setOrderedProducts(null);
                  filters.setProductSearch(e.target.value);
                }}
                placeholder="Search products..."
                className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-gray-200/60 rounded-2xl focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all premium-shadow"
              />
            </div>
          </div>

          {/* ── Products Grid with Drag-and-Drop ───────────────────────── */}
          {query.isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-brand animate-spin" />
            </div>
          ) : displayedProducts.length > 0 ? (
            <>
              {!filters.productSearch && (
                <div className="flex items-center gap-2 px-1 py-2 text-[11px] font-semibold text-gray-400 select-none">
                  <span className="inline-block w-4 h-4 opacity-50">⠿</span>
                  Drag cards to reorder products
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayedProducts.map((p) => (
                  <div
                    key={p.id}
                    draggable={!filters.productSearch}
                    onDragStart={() => {
                      draggedId.current = p.id;
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      dragOverId.current = p.id;
                    }}
                    onDragEnd={() => {
                      if (
                        !draggedId.current ||
                        !dragOverId.current ||
                        draggedId.current === dragOverId.current
                      ) {
                        draggedId.current = null;
                        dragOverId.current = null;
                        return;
                      }
                      const current = orderedProducts ?? query.products;
                      const fromIdx = current.findIndex(
                        (x) => x.id === draggedId.current,
                      );
                      const toIdx = current.findIndex(
                        (x) => x.id === dragOverId.current,
                      );
                      const reordered = [...current];
                      const [moved] = reordered.splice(fromIdx, 1);
                      reordered.splice(toIdx, 0, moved);
                      setOrderedProducts(reordered);
                      actions.handleReorderProducts(reordered.map((x) => x.id));
                      draggedId.current = null;
                      dragOverId.current = null;
                    }}
                    className="cursor-grab active:cursor-grabbing active:scale-[0.98] transition-transform"
                  >
                    <ProductCard
                      product={p}
                      storeId={sid}
                      onEdit={modal.openEdit}
                      onDelete={actions.handleDeleteProduct}
                      onToggleAvailability={actions.handleToggleAvailability}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200/80 premium-shadow">
              <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-brand" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">
                No products found
              </h3>
              <p className="text-[13px] text-gray-400 mt-1">
                {filters.activeSectionId
                  ? "This section has no products yet."
                  : "Start by adding sections and products to your catalog."}
              </p>
              <button
                onClick={modal.openCreate}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand to-brand-light rounded-2xl hover:shadow-lg hover:shadow-brand/15 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add First Product
              </button>
            </div>
          )}
        </div>
      </div>

      {(sectionsModal.state.type === "CREATE" ||
        sectionsModal.state.type === "EDIT") && (
        <SectionModal
          isOpen={true}
          onClose={sectionsModal.close}
          onSubmit={sectionsActions.handleSubmitSection}
          isPending={sectionsActions.isPending}
          editingSection={
            sectionsModal.state.type === "EDIT"
              ? sectionsModal.state.section
              : null
          }
        />
      )}

      {(modal.state.type === "CREATE" || modal.state.type === "EDIT") && (
        <ProductModal
          isOpen={true}
          onClose={modal.close}
          onSubmit={actions.handleSubmitProduct}
          isPending={actions.isPending}
          editingProduct={
            modal.state.type === "EDIT" ? modal.state.product : null
          }
          sections={sectionsQuery.sections}
          activeSectionId={filters.activeSectionId}
        />
      )}
    </div>
  );
}
