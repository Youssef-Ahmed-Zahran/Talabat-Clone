import { useState } from "react";
import toast from "react-hot-toast";
import { useDebounce } from "../../../hooks/useDebouncing";
import { 
  useMainCategories, 
  useSubCategories, 
  useCreateCategory, 
  useUpdateCategory,
  useDeleteCategory,
  useDeleteSubCategory,
  useCreateSubCategory,
  useUpdateSubCategory,
  useLinkStore,
  useUnlinkStore
} from "../api/category.api";
import type { Category } from "../../../types";
import type { CategoryFormValues } from "../../../schemas/category.schema";
import type { SubCategoryFormValues, LinkStoreFormValues } from "../../../schemas/subCategory.schema";

export function useMainCategoriesPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: categoriesData, isLoading, isFetching, isError, refetch } = useMainCategories(page, limit, debouncedSearch);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  const categories = categoriesData?.categories || [];
  const pagination = categoriesData?.pagination || null;

  const { data: subCategories, isLoading: subLoading } = useSubCategories(
    selectedCategoryId || "",
  );

  type ModalState =
    | { type: "NONE" }
    | { type: "MAIN_CREATE" }
    | { type: "MAIN_EDIT"; category: Category }
    | { type: "SUB_CREATE" }
    | { type: "SUB_EDIT"; subCategory: Category }
    | { type: "LINK_STORE"; subId: string }
    | { type: "LINKED_STORES"; subId: string };

  const [modalState, setModalState] = useState<ModalState>({ type: "NONE" });

  const closeModal = () => setModalState({ type: "NONE" });

  const selectedCategory = categories?.find((c: Category) => c.id === selectedCategoryId);

  const createCategoryMut = useCreateCategory();
  const updateCategoryMut = useUpdateCategory();
  const deleteSubMutation = useDeleteSubCategory();

  const handleOpenMainCreate = () => setModalState({ type: "MAIN_CREATE" });

  const handleOpenMainEdit = (category: Category) => setModalState({ type: "MAIN_EDIT", category });

  const handleOpenSubCreate = () => setModalState({ type: "SUB_CREATE" });

  const handleOpenSubEdit = (subCategory: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalState({ type: "SUB_EDIT", subCategory });
  };

  const handleDeleteSubCategory = (sub: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Are you sure you want to delete ${sub.name}? This will unlink all stores from this sub-category.`,
      )
    ) {
      deleteSubMutation.mutate(sub.id, {
        onSuccess: () => toast.success("Sub-category deleted"),
        onError: () => toast.error("Failed to delete sub-category"),
      });
    }
  };

  const handleOpenLinkModal = (subId: string) => setModalState({ type: "LINK_STORE", subId });

  const handleOpenLinkedStoresModal = (subId: string) => setModalState({ type: "LINKED_STORES", subId });

  const handleSubmitMainCategory = (data: CategoryFormValues) => {
    if (modalState.type === "MAIN_EDIT") {
      updateCategoryMut.mutate(
        {
          categoryId: modalState.category.id,
          name: data.name.trim(),
          image: data.image || undefined,
          isActive: data.isActive,
        },
        {
          onSuccess: () => {
            toast.success("Category updated");
            closeModal();
          },
          onError: () => toast.error("Failed to update category"),
        },
      );
    } else if (modalState.type === "MAIN_CREATE") {
      createCategoryMut.mutate(
        { name: data.name.trim(), image: data.image || undefined, isActive: data.isActive },
        {
          onSuccess: () => {
            toast.success("Category created");
            closeModal();
          },
          onError: () => toast.error("Failed to create category"),
        },
      );
    }
  };

  const deleteMainCategoryMut = useDeleteCategory();

  const handleDeleteMainCategory = (category: Category) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${category.name}? This will also delete all sub-categories and unlink stores.`
      )
    ) {
      deleteMainCategoryMut.mutate(category.id, {
        onSuccess: () => {
          toast.success("Category deleted");
          // If the deleted category was selected, deselect it
          if (selectedCategoryId === category.id) {
            setSelectedCategoryId(null);
          }
        },
        onError: () => toast.error("Failed to delete category"),
      });
    }
  };

  const createSubMutation = useCreateSubCategory();
  const updateSubMutation = useUpdateSubCategory();

  const handleSubmitSubCategory = (data: SubCategoryFormValues) => {
    if (modalState.type === "SUB_EDIT") {
      updateSubMutation.mutate(
        {
          subCategoryId: modalState.subCategory.id,
          name: data.name.trim(),
          image: data.image || undefined,
        },
        {
          onSuccess: () => {
            toast.success("Sub-category updated");
            closeModal();
          },
          onError: () => toast.error("Failed to update sub-category"),
        },
      );
    } else if (modalState.type === "SUB_CREATE") {
      if (!selectedCategoryId) return;
      createSubMutation.mutate(
        {
          name: data.name.trim(),
          parentId: selectedCategoryId,
          image: data.image || undefined,
        },
        {
          onSuccess: () => {
            toast.success("Sub-category created");
            closeModal();
          },
          onError: () => toast.error("Failed to create sub-category"),
        },
      );
    }
  };

  const linkStoreMutation = useLinkStore();
  const unlinkStoreMutation = useUnlinkStore();

  const handleLinkStore = (data: LinkStoreFormValues) => {
    if (modalState.type === "LINK_STORE") {
      linkStoreMutation.mutate(
        { subCategoryId: modalState.subId, storeId: data.storeId },
        {
          onSuccess: () => {
            toast.success("Store linked successfully");
            closeModal();
          },
          onError: () => toast.error("Failed to link store"),
        }
      );
    }
  };

  const handleUnlinkStore = (storeId: string) => {
    if (modalState.type === "LINKED_STORES") {
      if (
        window.confirm(
          "Are you sure you want to unlink this store from this sub-category?"
        )
      ) {
        unlinkStoreMutation.mutate(
          { subCategoryId: modalState.subId, storeId },
          {
            onSuccess: () => toast.success("Store unlinked successfully"),
            onError: () => toast.error("Failed to unlink store"),
          }
        );
      }
    }
  };

  return {
    query: {
      categories,
      pagination,
      isLoading,
      isFetching,
      isError,
      refetch,
      subCategories,
      subLoading,
      selectedCategory,
    },
    state: {
      search,
      setSearch,
      selectedCategoryId,
      setSelectedCategoryId,
      page,
      setPage,
      limit,
    },
    modal: {
      state: modalState,
      close: closeModal,
      main: {
        openCreate: handleOpenMainCreate,
        openEdit: handleOpenMainEdit,
      },
      sub: {
        openCreate: handleOpenSubCreate,
        openEdit: handleOpenSubEdit,
      },
      stores: {
        openLink: handleOpenLinkModal,
        openView: handleOpenLinkedStoresModal,
      },
    },
    actions: {
      main: {
        submit: handleSubmitMainCategory,
        delete: handleDeleteMainCategory,
        isPending: createCategoryMut.isPending || updateCategoryMut.isPending,
        isDeletePending: deleteMainCategoryMut.isPending,
      },
      sub: {
        submit: handleSubmitSubCategory,
        delete: handleDeleteSubCategory,
        isPending: createSubMutation.isPending || updateSubMutation.isPending,
        isDeletePending: deleteSubMutation.isPending,
      },
      stores: {
        link: handleLinkStore,
        isLinkPending: linkStoreMutation.isPending,
        unlink: handleUnlinkStore,
        isUnlinkPending: unlinkStoreMutation.isPending,
      },
    },
  };
}
