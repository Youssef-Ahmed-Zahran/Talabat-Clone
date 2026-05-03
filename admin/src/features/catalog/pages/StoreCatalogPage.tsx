import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore";
import {
  ArrowLeft,
  Plus,
  Package,
  Layers3,
  Search,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useSections,
  useDeleteSection,
  useProducts,
  useUpdateProduct,
  useDeleteProduct,
} from "../api/catalog.api";
import type { Section, Product } from "../../../types";
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import { handleApiError } from "../../../utils/error";
import { SectionModal } from "../components/SectionModal";
import { ProductModal } from "../components/ProductModal";
import { ProductCard } from "../components/ProductCard";
import { SectionTabs } from "../components/SectionTabs";

export default function StoreCatalogPage() {
  const params = useParams<{ storeId: string }>();
  const authStoreId = useAuthStore((s) => s.storeId);
  const role = useAuthStore((s) => s.role);
  const sid = params.storeId || authStoreId || "";

  // ── Sections ─────────────────────────────────────────────────
  const {
    data: sections,
    isLoading: sectionsLoading,
    isError: sectionsError,
    refetch: refetchSections,
  } = useSections(sid);
  // ✅ Only delete stays here — triggered from SectionTabs, not a modal
  const deleteSectionMut = useDeleteSection(sid);

  // ── Products ─────────────────────────────────────────────────
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const { data: productsData, isLoading: productsLoading } = useProducts(sid, {
    sectionId: activeSectionId || undefined,
    search: productSearch || undefined,
  });
  const products = productsData?.products ?? [];
  // ✅ updateProductMut stays here for toggle — delete stays for card action
  const updateProductMut = useUpdateProduct(sid);
  const deleteProductMut = useDeleteProduct(sid);

  // ── Modal state ──────────────────────────────────────────────
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // ── Handlers ─────────────────────────────────────────────────
  const openCreateSection = () => {
    setEditingSection(null);
    setShowSectionModal(true);
  };

  const openEditSection = (s: Section) => {
    setEditingSection(s);
    setShowSectionModal(true);
  };

  const handleDeleteSection = (s: Section) => {
    if (
      !confirm(
        `Delete section "${s.name}"? All products inside will be orphaned.`,
      )
    )
      return;
    deleteSectionMut.mutate(s.id, {
      onSuccess: () => {
        toast.success("Section deleted");
        if (activeSectionId === s.id) setActiveSectionId(null);
      },
      onError: (err) =>
        handleApiError(
          err,
          "We couldn't delete the section. Please try again.",
        ),
    });
  };

  const openCreateProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setShowProductModal(true);
  };

  const handleDeleteProduct = (p: Product) => {
    if (!confirm(`Delete product "${p.name}"? This cannot be undone.`)) return;
    deleteProductMut.mutate(p.id, {
      onSuccess: () => toast.success("Product deleted"),
      onError: (err) =>
        handleApiError(
          err,
          "We couldn't remove the product. Please try again.",
        ),
    });
  };

  // ✅ Stays here — toggle is a page-level card action, not a modal action
  const handleToggleAvailability = (p: Product) => {
    updateProductMut.mutate(
      { productId: p.id, isAvailable: !p.is_available },
      {
        onSuccess: () =>
          toast.success(p.is_available ? "Product hidden" : "Product visible"),
        onError: (err) =>
          handleApiError(
            err,
            "We couldn't update the product availability. Please try again.",
          ),
      },
    );
  };

  // ── Loading / Error ──────────────────────────────────────────
  if (sectionsLoading && !sections) return <PageLoader />;
  if (sectionsError) return <ErrorFallback onRetry={refetchSections} />;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={role === "owner" ? `/my-store` : `/stores/${sid}`}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Store Catalog
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage menu sections &amp; products
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openCreateSection}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Layers3 className="w-4 h-4" />
            Add Section
          </button>
          <button
            onClick={openCreateProduct}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      <SectionTabs
        sections={sections}
        activeSectionId={activeSectionId}
        onSectionChange={setActiveSectionId}
        onEditSection={openEditSection}
        onDeleteSection={handleDeleteSection}
      />

      {/* ── Search Bar ──────────────────────────────────────────── */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
        />
      </div>

      {/* ── Products Grid ────────────────────────────────────────── */}
      {productsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-brand animate-spin" />
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              storeId={sid}
              onEdit={openEditProduct}
              onDelete={handleDeleteProduct}
              onToggleAvailability={handleToggleAvailability}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-sm font-semibold text-gray-600">
            No products found
          </h3>
          <p className="text-[13px] text-gray-400 mt-1">
            {activeSectionId
              ? "This section has no products yet."
              : "Start by adding sections and products to your catalog."}
          </p>
          <button
            onClick={openCreateProduct}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Product
          </button>
        </div>
      )}

      <SectionModal
        isOpen={showSectionModal}
        onClose={() => setShowSectionModal(false)}
        editingSection={editingSection}
        storeId={sid}
        sectionsCount={sections?.length ?? 0}
        onSuccess={refetchSections}
      />

      <ProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        editingProduct={editingProduct}
        sections={sections}
        activeSectionId={activeSectionId}
        storeId={sid}
      />
    </div>
  );
}
