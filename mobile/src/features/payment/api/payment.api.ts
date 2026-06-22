import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@src/config/axios";
import type { PaymentMethod } from "@src/features/orders/types/order.types";
import type { ApiResponse } from "@src/types/api.types";
import { SavedCard, AddCardRequest } from "../types/payment.types";

// ─── Types ────────────────────────────────────────────────────// ─── Get Payment Methods ──────────────────────────────────────
export const usePaymentMethods = () => {
  return useQuery({
    queryKey: ["paymentMethods"],
    queryFn: async () => {
      const res =
        await api.get<ApiResponse<PaymentMethod[]>>("/payments/methods");
      return res.data.data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

// ─── Get Store Payment Methods ────────────────────────────────
export const useStorePaymentMethods = (storeId: string) => {
  return useQuery({
    queryKey: ["storePaymentMethods", storeId],
    queryFn: async () => {
      const res = await api.get<
        ApiResponse<{ paymentMethod: PaymentMethod }[]>
      >(`/payments/stores/${storeId}/methods`);
      return res.data.data.map((spm) => spm.paymentMethod);
    },
    enabled: !!storeId,
  });
};

// ─── Saved Cards ──────────────────────────────────────────────
export const useSavedCards = () => {
  return useQuery({
    queryKey: ["savedCards"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SavedCard[]>>("/payments/cards");
      return res.data.data;
    },
  });
};

export const useAddCard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AddCardRequest) => {
      const res = await api.post<ApiResponse<SavedCard>>(
        "/payments/cards",
        data,
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savedCards"] });
    },
  });
};

export const useDeleteCard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/payments/cards/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savedCards"] });
    },
  });
};

export const useSetDefaultCard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch<ApiResponse<SavedCard>>(
        `/payments/cards/${id}/default`,
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savedCards"] });
    },
  });
};
