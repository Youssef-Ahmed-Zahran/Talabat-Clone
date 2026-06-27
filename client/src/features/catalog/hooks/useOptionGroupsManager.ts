import { useState } from "react";
import toast from "react-hot-toast";
import type { OptionGroupFormValues } from "../../../schemas/productOption.schema";
import type { OptionGroup } from "../../../types";
import {
  useCreateOptionGroup,
  useDeleteOptionGroup,
  useOptionGroups,
  useUpdateOptionGroup,
} from "../api/catalog.api";

export function useOptionGroupsManager(sid: string, pid: string) {
  const {
    data: optionGroups,
    isLoading: groupsLoading,
  } = useOptionGroups(sid, pid);

  const createGroupMut = useCreateOptionGroup(sid);
  const updateGroupMut = useUpdateOptionGroup(sid);
  const deleteGroupMut = useDeleteOptionGroup(sid);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  type ModalState =
    | { type: "NONE" }
    | { type: "CREATE" }
    | { type: "EDIT"; group: OptionGroup };

  const [modalState, setModalState] = useState<ModalState>({ type: "NONE" });

  const toggleGroupExpand = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreateGroup = () => setModalState({ type: "CREATE" });
  const openEditGroup = (g: OptionGroup) => setModalState({ type: "EDIT", group: g });
  const closeModal = () => setModalState({ type: "NONE" });

  const handleDeleteGroup = (g: OptionGroup) => {
    if (!confirm(`Delete option group "${g.name}" and all its values?`)) return;
    deleteGroupMut.mutate(g.id, {
      onSuccess: () => toast.success("Option group deleted"),
      onError: () => toast.error("Failed to delete"),
    });
  };

  const handleSubmitGroup = (data: OptionGroupFormValues) => {
    if (modalState.type === "EDIT") {
      updateGroupMut.mutate(
        {
          groupId: modalState.group.id,
          name: data.name.trim(),
          isRequired: data.isRequired,
          minSelect: Number(data.minSelect),
          maxSelect: Number(data.maxSelect),
        },
        {
          onSuccess: () => {
            toast.success("Option group updated");
            closeModal();
          },
          onError: () => toast.error("Failed to update option group"),
        },
      );
    } else if (modalState.type === "CREATE") {
      createGroupMut.mutate(
        {
          productId: pid,
          name: data.name.trim(),
          isRequired: data.isRequired,
          minSelect: Number(data.minSelect),
          maxSelect: Number(data.maxSelect),
        },
        {
          onSuccess: () => {
            toast.success("Option group created");
            closeModal();
          },
          onError: () => toast.error("Failed to create option group"),
        },
      );
    }
  };

  return {
    query: {
      optionGroups,
      isLoading: groupsLoading,
    },
    state: {
      expandedGroups,
      toggleGroupExpand,
    },
    modal: {
      state: modalState,
      close: closeModal,
      openCreate: openCreateGroup,
      openEdit: openEditGroup,
    },
    actions: {
      handleDeleteGroup,
      handleSubmitGroup,
      isPending: createGroupMut.isPending || updateGroupMut.isPending,
    },
  };
}
