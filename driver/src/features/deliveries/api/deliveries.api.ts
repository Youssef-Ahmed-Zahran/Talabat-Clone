import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import api from '@config/axios';
import type { ApiResponse } from '@src/types/api.types';

import type {
  ActiveDeliveryOrder,
  PendingAssignment,
  DeliveryStatus,
} from '../types/deliveries.types';

export type { ActiveDeliveryOrder, PendingAssignment, DeliveryStatus };

// ─── Query Keys ───────────────────────────────────────────────
export const DELIVERY_KEYS = {
  all: ['deliveries'] as const,
  active: () => [...DELIVERY_KEYS.all, 'active'] as const,
  pending: () => [...DELIVERY_KEYS.all, 'pending'] as const,
  history: () => [...DELIVERY_KEYS.all, 'history'] as const,
};

// ─── Get Active Delivery ───────────────────────────────────────
export const useActiveDelivery = () => {
  return useQuery({
    queryKey: DELIVERY_KEYS.active(),
    queryFn: async () => {
      const res = await api.get<ApiResponse<ActiveDeliveryOrder | null>>('/drivers/orders/active');
      return res.data.data;
    },
    refetchInterval: 30_000, // Poll every 30s to keep in sync
  });
};

// ─── Get Pending Assignment ────────────────────────────────────
export const usePendingAssignment = () => {
  return useQuery({
    queryKey: DELIVERY_KEYS.pending(),
    queryFn: async () => {
      const res = await api.get<ApiResponse<PendingAssignment | null>>('/drivers/orders/pending');
      return res.data.data;
    },
    refetchInterval: 10_000,
  });
};

// ─── Accept Order ──────────────────────────────────────────────
export const useAcceptDelivery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await api.post<ApiResponse<any>>(`/drivers/orders/${orderId}/accept`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DELIVERY_KEYS.active() });
      qc.invalidateQueries({ queryKey: DELIVERY_KEYS.pending() });
    },
  });
};

// ─── Reject Order ─────────────────────────────────────────────
export const useRejectDelivery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
      await api.post(`/drivers/orders/${orderId}/reject`, { reason });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DELIVERY_KEYS.pending() });
    },
  });
};

// ─── Update Delivery Status ───────────────────────────────────
export const useUpdateDeliveryStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: DeliveryStatus }) => {
      const res = await api.patch<ApiResponse<any>>(`/drivers/orders/${orderId}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DELIVERY_KEYS.active() });
    },
  });
};

// ─── Delivery History Query ───────────────────────────────────
export const useDeliveryHistoryQuery = () => {
  return useInfiniteQuery({
    queryKey: DELIVERY_KEYS.history(),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get<ApiResponse<any>>(
        `/drivers/earnings?page=${pageParam}&limit=20&period=all`
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
  });
};
