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

  type ModalState =
    | { type: "NONE" }
    | { type: "CREATE"; groupId: string }
    | { type: "EDIT"; groupId: string; value: OptionValue };

  const [modalState, setModalState] = useState<ModalState>({ type: "NONE" });

  const openAddValue = (groupId: string) => setModalState({ type: "CREATE", groupId });
  const openEditValue = (groupId: string, v: OptionValue) => setModalState({ type: "EDIT", groupId, value: v });
  const closeModal = () => setModalState({ type: "NONE" });

  const handleDeleteValue = (valueId: string) => {
    if (!confirm("Delete this option value?")) return;
    deleteValueMut.mutate(valueId, {
      onSuccess: () => toast.success("Value deleted"),
      onError: () => toast.error("Failed to delete"),
    });
  };

  const handleSubmitValue = (data: OptionValueFormValues) => {
    if (modalState.type === "NONE") return;

    if (modalState.type === "EDIT") {
      updateValueMut.mutate(
        {
          valueId: modalState.value.id,
          name: data.name.trim(),
          extraPrice: Number(data.extraPrice) || 0,
        },
        {
          onSuccess: () => {
            toast.success("Option value updated");
            closeModal();
          },
          onError: () => toast.error("Failed to update value"),
        },
      );
    } else if (modalState.type === "CREATE") {
      createValueMut.mutate(
        {
          groupId: modalState.groupId,
          name: data.name.trim(),
          extraPrice: Number(data.extraPrice) || 0,
        },
        {
          onSuccess: () => {
            toast.success("Option value added");
            closeModal();
          },
          onError: () => toast.error("Failed to add value"),
        },
      );
    }
  };

  return {
    modal: {
      state: modalState,
      close: closeModal,
      openCreate: openAddValue,
      openEdit: openEditValue,
    },
    actions: {
      handleDeleteValue,
      handleSubmitValue,
      isPending: createValueMut.isPending || updateValueMut.isPending,
    },
  };
}
