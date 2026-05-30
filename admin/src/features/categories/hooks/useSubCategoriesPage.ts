import { useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  useSubCategories,
  useCreateSubCategory,
  useUpdateSubCategory,
  useDeleteSubCategory,
  useLinkStore,
  useUnlinkStore
} from "../api/category.api";
import type { Category } from "../../../types";
import type { SubCategoryFormValues, LinkStoreFormValues } from "../../../schemas/subCategory.schema";

export function useSubCategoriesPage() {
  const { mainId } = useParams<{ mainId: string }>();
  const categoryId = mainId || "";

  const {
    data: subCategories,
    isLoading,
    isError,
    refetch,
  } = useSubCategories(categoryId);

  type ModalState =
    | { type: "NONE" }
    | { type: "SUB_CREATE" }
    | { type: "SUB_EDIT"; subCategory: Category }
    | { type: "LINK_STORE"; subId: string }
    | { type: "LINKED_STORES"; subId: string };

  const [modalState, setModalState] = useState<ModalState>({ type: "NONE" });

  const closeModal = () => setModalState({ type: "NONE" });

  const handleOpenSubCreate = () => setModalState({ type: "SUB_CREATE" });
  const handleOpenSubEdit = (subCategory: Category) => setModalState({ type: "SUB_EDIT", subCategory });
  const handleOpenLinkModal = (subId: string) => setModalState({ type: "LINK_STORE", subId });
  const handleOpenLinkedStoresModal = (subId: string) => setModalState({ type: "LINKED_STORES", subId });

  const createSubMutation = useCreateSubCategory();
  const updateSubMutation = useUpdateSubCategory();
  const deleteSubMutation = useDeleteSubCategory();
  const linkStoreMutation = useLinkStore();

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
        }
      );
    } else if (modalState.type === "SUB_CREATE") {
      if (!categoryId) return;
      createSubMutation.mutate(
        {
          name: data.name.trim(),
          parentId: categoryId,
          image: data.image || undefined,
        },
        {
          onSuccess: () => {
            toast.success("Sub-category created");
            closeModal();
          },
          onError: () => toast.error("Failed to create sub-category"),
        }
      );
    }
  };

  const handleDeleteSubCategory = (sub: Category) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${sub.name}? This will unlink all stores from this sub-category.`
      )
    ) {
      deleteSubMutation.mutate(sub.id, {
        onSuccess: () => toast.success("Sub-category deleted"),
        onError: () => toast.error("Failed to delete sub-category"),
      });
    }
  };

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

  const unlinkStoreMutation = useUnlinkStore();

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
      categoryId,
      subCategories,
      isLoading,
      isError,
      refetch,
    },
    modal: {
      state: modalState,
      close: closeModal,
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
