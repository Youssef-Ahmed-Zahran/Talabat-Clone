import { useState } from "react";
import toast from "react-hot-toast";
import type { OptionValueFormValues } from "../../../schemas/productOption.schema";
import type { OptionValue } from "../../../types";
import {
  useCreateOptionValue,
  useDeleteOptionValue,
  useUpdateOptionValue,
} from "../api/catalog.api";

export function useOptionValuesManager(sid: string) {
  const createValueMut = useCreateOptionValue(sid);
  const updateValueMut = useUpdateOptionValue(sid);
  const deleteValueMut = useDeleteOptionValue(sid);

  const [showValueModal, setShowValueModal] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<OptionValue | null>(null);

  const openAddValue = (groupId: string) => {
    setActiveGroupId(groupId);
    setEditingValue(null);
    setShowValueModal(true);
  };

  const openEditValue = (groupId: string, v: OptionValue) => {
    setActiveGroupId(groupId);
    setEditingValue(v);
    setShowValueModal(true);
  };

  const handleDeleteValue = (valueId: string) => {
    if (!confirm("Delete this option value?")) return;
    deleteValueMut.mutate(valueId, {
      onSuccess: () => toast.success("Value deleted"),
      onError: () => toast.error("Failed to delete"),
    });
  };

  const handleSubmitValue = (data: OptionValueFormValues) => {
    if (!activeGroupId) return;

    if (editingValue) {
      updateValueMut.mutate(
        {
          valueId: editingValue.id,
          name: data.name.trim(),
          extraPrice: Number(data.extraPrice) || 0,
        },
        {
          onSuccess: () => {
            toast.success("Option value updated");
            setShowValueModal(false);
          },
          onError: () => toast.error("Failed to update value"),
        },
      );
    } else {
      createValueMut.mutate(
        {
          groupId: activeGroupId,
          name: data.name.trim(),
          extraPrice: Number(data.extraPrice) || 0,
        },
        {
          onSuccess: () => {
            toast.success("Option value added");
            setShowValueModal(false);
          },
          onError: () => toast.error("Failed to add value"),
        },
      );
    }
  };

  return {
    modal: {
      isOpen: showValueModal,
      setIsOpen: setShowValueModal,
      activeGroupId,
      editingValue,
      openAddValue,
      openEditValue,
    },
    actions: {
      handleDeleteValue,
      handleSubmitValue,
      isPending: createValueMut.isPending || updateValueMut.isPending,
    },
  };
}
