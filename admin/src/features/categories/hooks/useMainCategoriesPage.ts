import { useState } from "react";
import { useMainCategories, useSubCategories } from "../api/category.api";

export function useMainCategoriesPage() {
  const { data: categories, isLoading, isError, refetch } = useMainCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  const { data: subCategories, isLoading: subLoading } = useSubCategories(
    selectedCategoryId || "",
  );

  const [showMainModal, setShowMainModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);

  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);

  return {
    query: {
      categories,
      isLoading,
      isError,
      refetch,
      subCategories,
      subLoading,
      selectedCategory,
    },
    state: {
      selectedCategoryId,
      setSelectedCategoryId,
    },
    modal: {
      showMainModal,
      setShowMainModal,
      showSubModal,
      setShowSubModal,
    },
  };
}
