import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import api from "@src/config/axios";
import type {
  Order,
  PlaceOrderRequest,
} from "@src/features/orders/types/order.types";
import type { ApiResponse } from "@src/types/api.types";
import { useCartStore } from "@src/store/cartStore";
import { useUIStore } from "@src/store/uiStore";

// ─── Get My Orders ────────────────────────────────────────────
export const useMyOrders = () => {
  return useInfiniteQuery({
    queryKey: ["orders", "my"],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const res =
        await api.get<ApiResponse<{ orders: Order[]; pagination: any }>>(
          "/orders/my",
          { params: { page: pageParam, limit: 10 } }
        );
      return res?.data?.data;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage?.pagination) return undefined;
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 30_000, // treat data as fresh for 30s — no background flicker
  });
};

// ─── Get Order by ID ──────────────────────────────────────────
export const useOrderById = (orderId: string) => {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Order>>(`/orders/my/${orderId}`);
      return res.data.data;
    },
    enabled: !!orderId,
    refetchInterval: 10000, // Poll every 10s for status updates
  });
};

// ─── Place Order ──────────────────────────────────────────────
export const usePlaceOrder = () => {
  const qc = useQueryClient();
  const clearCart = useCartStore((s) => s.clearCart);
  const setActiveOrder = useUIStore((s) => s.setActiveOrder);

  return useMutation({
    mutationFn: async (data: PlaceOrderRequest) => {
      const res = await api.post<ApiResponse<Order>>("/orders", data);
      return res.data.data;
    },
    onSuccess: (order) => {
      clearCart();
      setActiveOrder(order.id, order.status);
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};

// ─── Cancel Order ─────────────────────────────────────────────
export const useCancelOrder = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
    }: {
      orderId: string;
      reason?: string;
    }) => {
      const res = await api.patch<ApiResponse<Order>>(
        `/orders/${orderId}/cancel`,
        { cancellationReason: reason },
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

// ─── Reorder ──────────────────────────────────────────────────
export const useReorder = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await api.post<ApiResponse<Order>>(
        `/orders/${orderId}/reorder`,
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};
