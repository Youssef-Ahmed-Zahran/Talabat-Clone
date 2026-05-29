import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import api from "../../../config/axios";
import type { Order } from "../../../types";

import { useAuthStore } from "../../../store/authStore";

// ── Fetch all orders (admin/owner endpoint) ──────────────────────────────────
const fetchLiveOrders = async (search?: string): Promise<Order[]> => {
  const role = useAuthStore.getState().role;
  const endpoint = role === "owner" ? "/orders/store" : "/orders/admin/all";
  const { data } = await api.get(endpoint, {
    params: { search },
  });
  const payload = data.data ?? data;
  // Backend may return { orders, pagination } or just an array
  return Array.isArray(payload) ? payload : (payload.orders ?? []);
};

export const useLiveOrders = (search?: string) => {
  return useQuery({
    queryKey: ["orders", "live", search],
    queryFn: () => fetchLiveOrders(search),
    refetchInterval: 15_000,
    placeholderData: keepPreviousData,
  });
};

// ── Update order status (admin/owner endpoint) ───────────────────────────────
interface UpdateStatusPayload {
  orderId: string | number;
  status: string;
}

const updateOrderStatus = async ({ orderId, status }: UpdateStatusPayload) => {
  const role = useAuthStore.getState().role;
  const endpoint =
    role === "owner"
      ? `/orders/store/${orderId}/status`
      : `/orders/admin/${orderId}/status`;
  const { data } = await api.patch(endpoint, { status });
  return data.data ?? data;
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: (data) => {
      // Optimistically update the orders list in cache without triggering a refetch
      qc.setQueriesData({ queryKey: ["orders"] }, (oldData: Order[] | undefined) => {
        if (Array.isArray(oldData)) {
          return oldData.map((order: Order) =>
            order.id === data.orderId
              ? { ...order, status: data.status }
              : order
          );
        }
        return oldData;
      });
    },
  });
};
