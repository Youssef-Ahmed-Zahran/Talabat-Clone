import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { UsePaymentReturn } from "../types/payment.types";
import {
  useSavedCards,
  useDeleteCard,
  useSetDefaultCard,
} from "../api/payment.api";

export function usePayment(): UsePaymentReturn {
  const { data: cards, isLoading } = useSavedCards();
  const deleteCard = useDeleteCard();
  const setDefaultCard = useSetDefaultCard();

  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert("Remove Card", "Are you sure you want to remove this card?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setDeletingId(id);
            deleteCard.mutate(id, {
              onSettled: () => setDeletingId(null),
            });
          },
        },
      ]);
    },
    [deleteCard],
  );

  const handleSetDefault = useCallback(
    (id: string) => {
      setSettingDefaultId(id);
      setDefaultCard.mutate(id, {
        onSettled: () => setSettingDefaultId(null),
      });
    },
    [setDefaultCard],
  );

  return {
    query: {
      cards,
      isLoading,
    },
    state: {
      showModal,
      deletingId,
      settingDefaultId,
    },
    actions: {
      openModal,
      closeModal,
      handleDelete,
      handleSetDefault,
    },
  };
}
