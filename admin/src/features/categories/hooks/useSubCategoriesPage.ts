import { useState } from "react";
import { useParams } from "react-router-dom";
import { useSubCategories } from "../api/category.api";

export function useSubCategoriesPage() {
  const { mainId } = useParams<{ mainId: string }>();
  const categoryId = mainId || "";

  const {
    data: subCategories,
    isLoading,
    isError,
    refetch,
  } = useSubCategories(categoryId);

  const [showCreateModal, setShowCreateModal] = useState(false);

  return {
    query: {
      categoryId,
      subCategories,
      isLoading,
      isError,
      refetch,
    },
    modal: {
      showCreateModal,
      setShowCreateModal,
    },
  };
}
