import { useState } from "react";
import toast from "react-hot-toast";
import { useSections, useDeleteSection } from "../api/catalog.api";
import type { Section } from "../../../types";
import { handleApiError } from "../../../utils/error";

export function useSectionsManager(sid: string, activeSectionId: string | null, onClearSection: () => void) {
  const {
    data: sections,
    isLoading,
    isError,
    refetch,
  } = useSections(sid);

  const deleteSectionMut = useDeleteSection(sid);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  const openCreate = () => {
    setEditingSection(null);
    setIsModalOpen(true);
  };

  const openEdit = (s: Section) => {
    setEditingSection(s);
    setIsModalOpen(true);
  };

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

  return {
    query: {
      sections,
      isLoading,
      isError,
      refetch,
    },
    modal: {
      isOpen: isModalOpen,
      setIsOpen: setIsModalOpen,
      editingSection,
      openCreateSection: openCreate,
      openEditSection: openEdit,
    },
    actions: {
      handleDeleteSection: handleDelete,
    },
  };
}
