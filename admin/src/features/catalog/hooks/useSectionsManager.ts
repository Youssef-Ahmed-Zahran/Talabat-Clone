import { useState } from "react";
import toast from "react-hot-toast";
import { useSections, useDeleteSection, useCreateSection, useUpdateSection } from "../api/catalog.api";
import type { Section } from "../../../types";
import { handleApiError } from "../../../utils/error";
import type { SectionFormValues } from "../../../schemas/catalog.schema";

export function useSectionsManager(sid: string, activeSectionId: string | null, onClearSection: () => void) {
  const {
    data: sections,
    isLoading,
    isError,
    refetch,
  } = useSections(sid);

  const deleteSectionMut = useDeleteSection(sid);
  const createSectionMut = useCreateSection(sid);
  const updateSectionMut = useUpdateSection(sid);

  type ModalState =
    | { type: "NONE" }
    | { type: "CREATE" }
    | { type: "EDIT"; section: Section };

  const [modalState, setModalState] = useState<ModalState>({ type: "NONE" });

  const openCreate = () => setModalState({ type: "CREATE" });
  const openEdit = (s: Section) => setModalState({ type: "EDIT", section: s });
  const closeModal = () => setModalState({ type: "NONE" });

  const handleDelete = (s: Section) => {
    if (!confirm(`Delete section "${s.name}"? All products inside will be orphaned.`)) return;
    deleteSectionMut.mutate(s.id, {
      onSuccess: () => {
        toast.success("Section deleted");
        if (activeSectionId === s.id) onClearSection();
      },
      onError: (err) => handleApiError(err, "We couldn't delete the section. Please try again."),
    });
  };

  const handleSubmitSection = (data: SectionFormValues) => {
    if (modalState.type === "EDIT") {
      updateSectionMut.mutate(
        { sectionId: modalState.section.id, name: data.name.trim() },
        {
          onSuccess: () => {
            toast.success("Section updated");
            closeModal();
            refetch();
          },
          onError: (err) => handleApiError(err, "Couldn't update section."),
        },
      );
    } else if (modalState.type === "CREATE") {
      createSectionMut.mutate(
        { name: data.name.trim(), sortOrder: sections?.length ?? 0 },
        {
          onSuccess: () => {
            toast.success("Section created");
            closeModal();
            refetch();
          },
          onError: (err) => handleApiError(err, "Couldn't create section."),
        },
      );
    }
  };

  return {
    query: {
      sections,
      isLoading,
      isError,
      refetch,
    },
    modal: {
      state: modalState,
      close: closeModal,
      openCreate,
      openEdit,
    },
    actions: {
      handleDeleteSection: handleDelete,
      handleSubmitSection,
      isPending: createSectionMut.isPending || updateSectionMut.isPending,
    },
  };
}
