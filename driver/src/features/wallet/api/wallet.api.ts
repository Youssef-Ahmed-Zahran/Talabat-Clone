import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@config/axios";
import type { ApiResponse } from "@src/types/api.types";
import type { WalletData, DebtPayment, RepayDebtPayload } from "../types/wallet.types";

// ─── Query Keys ───────────────────────────────────────────────
export const WALLET_KEYS = {
  all: ["driver", "wallet"] as const,
  details: () => ["driver", "wallet"] as const,
  transactions: () => ["driver", "wallet", "transactions"] as const,
  payments: () => ["driver", "wallet", "payments"] as const,
};

// ─── Wallet Details Query ──────────────────────────────────────
export const useWalletDetailsQuery = () => {
  return useQuery({
    queryKey: WALLET_KEYS.details(),
    queryFn: async () => {
      const res = await api.get<ApiResponse<WalletData>>("/drivers/wallet");
      return res.data.data!;
    },
    staleTime: 1000 * 30,
  });
};

// ─── Wallet Transactions Infinite Query ───────────────────────
export const useWalletTransactionsQuery = () => {
  return useInfiniteQuery({
    queryKey: WALLET_KEYS.transactions(),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get<ApiResponse<any>>(
        `/drivers/wallet/transactions?page=${pageParam}&limit=20`
      );
      return res.data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60,
  });
};

// ─── Wallet Payments Infinite Query ───────────────────────────
export const useWalletPaymentsQuery = () => {
  return useInfiniteQuery({
    queryKey: WALLET_KEYS.payments(),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get<ApiResponse<any>>(
        `/drivers/wallet/payments?page=${pageParam}&limit=20`
      );
      return res.data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60,
  });
};

// ─── Repay Debt Mutation ───────────────────────────────────────
export const useRepayDebtMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RepayDebtPayload) => {
      const res = await api.post<ApiResponse<{ payment: DebtPayment; message: string }>>(
        "/drivers/wallet/repay",
        payload
      );
      return res.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WALLET_KEYS.all });
    },
  });
};
