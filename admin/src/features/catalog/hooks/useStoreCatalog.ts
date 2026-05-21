import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore";
import toast from "react-hot-toast";
import {
  useSections,
  useDeleteSection,
  useProducts,
  useUpdateProduct,
  useDeleteProduct,
} from "../api/catalog.api";
import type { Section, Product } from "../../../types";
import { handleApiError } from "../../../utils/error";

export function useStoreCatalog() {
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
  
  const deleteSectionMut = useDeleteSection(sid);

  // ── Products ─────────────────────────────────────────────────
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  
  const { data: productsData, isLoading: productsLoading } = useProducts(sid, {
    sectionId: activeSectionId || undefined,
    search: productSearch || undefined,
  });
  
  const products = productsData?.products ?? [];
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

  return {
    sid,
    role,
    sections,
    sectionsLoading,
    sectionsError,
    refetchSections,
    activeSectionId,
    setActiveSectionId,
    productSearch,
    setProductSearch,
    products,
    productsLoading,
    showSectionModal,
    setShowSectionModal,
    editingSection,
    showProductModal,
    setShowProductModal,
    editingProduct,
    openCreateSection,
    openEditSection,
    handleDeleteSection,
    openCreateProduct,
    openEditProduct,
    handleDeleteProduct,
    handleToggleAvailability,
  };
}
