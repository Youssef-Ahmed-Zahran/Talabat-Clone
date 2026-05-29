import { useState } from "react";
import toast from "react-hot-toast";
import { useProducts, useUpdateProduct, useDeleteProduct, useCreateProduct } from "../api/catalog.api";
import type { Product } from "../../../types";
import { handleApiError } from "../../../utils/error";
import type { ProductFormValues } from "../../../schemas/catalog.schema";

export function useProductsManager(sid: string) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");

  const { data: productsData, isLoading: productsLoading } = useProducts(sid, {
    sectionId: activeSectionId || undefined,
    search: productSearch || undefined,
  });

  const products = productsData?.products ?? [];
  const updateProductMut = useUpdateProduct(sid);
  const deleteProductMut = useDeleteProduct(sid);
  const createProductMut = useCreateProduct(sid);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const openCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setIsModalOpen(true);
  };

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
    if (editingProduct) {
      updateProductMut.mutate(
        {
          productId: editingProduct.id,
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          price: Number(data.price),
          quantity: data.quantity !== "" ? Number(data.quantity) : undefined,
          sectionId: data.sectionId || undefined,
          meta: data.meta,
        },
        {
          onSuccess: () => {
            toast.success("Product updated");
            setIsModalOpen(false);
          },
          onError: (err) => handleApiError(err, "Couldn't update product."),
        },
      );
    } else {
      createProductMut.mutate(
        {
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          price: Number(data.price),
          quantity: data.quantity !== "" ? Number(data.quantity) : undefined,
          sectionId: data.sectionId || undefined,
          meta: data.meta,
          optionGroups: data.optionGroups,
        },
        {
          onSuccess: () => {
            toast.success("Product created");
            setIsModalOpen(false);
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
    },
    modal: {
      isOpen: isModalOpen,
      setIsOpen: setIsModalOpen,
      editingProduct,
      openCreateProduct: openCreate,
      openEditProduct: openEdit,
    },
    actions: {
      handleDeleteProduct: handleDelete,
      handleToggleAvailability,
      handleSubmitProduct,
      isPending: createProductMut.isPending || updateProductMut.isPending,
    },
  };
}
