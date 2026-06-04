import { useState } from "react";
import toast from "react-hot-toast";
import { useProducts, useUpdateProduct, useDeleteProduct, useCreateProduct } from "../api/catalog.api";
import type { Product } from "../../../types";
import { handleApiError } from "../../../utils/error";
import type { ProductFormValues } from "../../../schemas/catalog.schema";

export function useProductsManager(sid: string) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");

  const { data: productsData, isLoading: productsLoading, isFetching: productsFetching } = useProducts(sid, {
    sectionId: activeSectionId || undefined,
    search: productSearch || undefined,
  });

  const products = productsData?.products ?? [];
  const updateProductMut = useUpdateProduct(sid);
  const deleteProductMut = useDeleteProduct(sid);
  const createProductMut = useCreateProduct(sid);

  type ModalState =
    | { type: "NONE" }
    | { type: "CREATE" }
    | { type: "EDIT"; product: Product };

  const [modalState, setModalState] = useState<ModalState>({ type: "NONE" });

  const openCreate = () => setModalState({ type: "CREATE" });
  const openEdit = (p: Product) => setModalState({ type: "EDIT", product: p });
  const closeModal = () => setModalState({ type: "NONE" });

  const handleDelete = (p: Product) => {
    if (!confirm(`Delete product "${p.name}"? This cannot be undone.`)) return;
    deleteProductMut.mutate(p.id, {
      onSuccess: () => toast.success("Product deleted"),
      onError: (err) => handleApiError(err, "We couldn't remove the product. Please try again."),
    });
  };

  const handleToggleAvailability = (p: Product) => {
    updateProductMut.mutate(
      { productId: p.id, isAvailable: !p.is_available },
      {
        onSuccess: () => toast.success(p.is_available ? "Product hidden" : "Product visible"),
        onError: (err) => handleApiError(err, "We couldn't update the product availability. Please try again."),
      },
    );
  };

  const handleSubmitProduct = (data: ProductFormValues) => {
    if (modalState.type === "EDIT") {
      updateProductMut.mutate(
        {
          productId: modalState.product.id,
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          price: Number(data.price),
          quantity: data.quantity !== "" ? Number(data.quantity) : undefined,
          sectionId: data.sectionId || undefined,
          meta: data.meta,
          primaryImage: data.primaryImage || undefined,
          optionGroups: data.optionGroups,
        },
        {
          onSuccess: () => {
            toast.success("Product updated");
            closeModal();
          },
          onError: (err) => handleApiError(err, "Couldn't update product."),
        },
      );
    } else if (modalState.type === "CREATE") {
      createProductMut.mutate(
        {
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          price: Number(data.price),
          quantity: data.quantity !== "" ? Number(data.quantity) : undefined,
          sectionId: data.sectionId || undefined,
          meta: data.meta,
          primaryImage: data.primaryImage || undefined,
          images: data.images && data.images.length > 0 ? data.images : undefined,
          optionGroups: data.optionGroups,
        },
        {
          onSuccess: () => {
            toast.success("Product created");
            closeModal();
          },
          onError: (err) => handleApiError(err, "Couldn't create product."),
        },
      );
    }
  };

  return {
    filters: {
      activeSectionId,
      setActiveSectionId,
      productSearch,
      setProductSearch,
    },
    query: {
      products,
      isLoading: productsLoading,
      isFetching: productsFetching,
    },
    modal: {
      state: modalState,
      close: closeModal,
      openCreate,
      openEdit,
    },
    actions: {
      handleDeleteProduct: handleDelete,
      handleToggleAvailability,
      handleSubmitProduct,
      isPending: createProductMut.isPending || updateProductMut.isPending,
    },
  };
}
