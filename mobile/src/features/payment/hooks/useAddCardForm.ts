import React, { useState } from "react";
import { Alert } from "react-native";
import { useAddCard, type AddCardRequest } from "../api/payment.api";

export interface UseAddCardFormReturn {
  state: {
    form: AddCardRequest;
    setForm: React.Dispatch<React.SetStateAction<AddCardRequest>>;
    expiry: string;
  };
  actions: {
    handleExpiryChange: (val: string) => void;
    handleSubmit: () => void;
    isPending: boolean;
  };
}

export function useAddCardForm(onClose: () => void): UseAddCardFormReturn {
  const addCard = useAddCard();
  const [form, setForm] = useState<AddCardRequest>({
    brand: "VISA",
    lastFour: "",
    expiryMonth: 1,
    expiryYear: new Date().getFullYear(),
    isDefault: false,
  });
  const [expiry, setExpiry] = useState(""); // "MM/YY" input

  const handleExpiryChange = (val: string) => {
    // Auto-insert slash after 2 digits
    const cleaned = val.replace(/\D/g, "").slice(0, 4);
    const formatted =
      cleaned.length > 2
        ? `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`
        : cleaned;
    setExpiry(formatted);
    if (cleaned.length === 4) {
      setForm((f) => ({
        ...f,
        expiryMonth: parseInt(cleaned.slice(0, 2), 10),
        expiryYear: 2000 + parseInt(cleaned.slice(2), 10),
      }));
    }
  };

  const handleSubmit = () => {
    if (form.lastFour.length !== 4) {
      Alert.alert("Error", "Please enter the last 4 digits of your card.");
      return;
    }
    if (expiry.length < 5) {
      Alert.alert("Error", "Please enter a valid expiry date (MM/YY).");
      return;
    }
    addCard.mutate(form, {
      onSuccess: () => {
        setForm({
          brand: "VISA",
          lastFour: "",
          expiryMonth: 1,
          expiryYear: new Date().getFullYear(),
          isDefault: false,
        });
        setExpiry("");
        onClose();
      },
      onError: () =>
        Alert.alert("Error", "Failed to save card. Please try again."),
    });
  };

  return {
    state: {
      form,
      setForm,
      expiry,
    },
    actions: {
      handleExpiryChange,
      handleSubmit,
      isPending: addCard.isPending,
    },
  };
}
