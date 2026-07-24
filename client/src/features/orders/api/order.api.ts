import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import api from "../../../config/axios";
import type { Order } from "../../../types";


export interface OrdersResponse {
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ── Fetch all orders (admin/owner endpoint) ──────────────────────────────────
const fetchLiveOrders = async (role: "owner" | null, search?: string, page?: number, limit?: number): Promise<OrdersResponse> => {
  const endpoint = role === "owner" ? "/orders/store" : "/orders/admin/all";
  const { data } = await api.get(endpoint, {
    params: { search, page, limit },
  });
  const payload = data.data ?? data;
  return payload;
};

export const useLiveOrders = (role: "owner" | null, search?: string, page?: number, limit?: number) => {
  return useQuery({
    queryKey: ["orders", "live", role, search, page, limit],
    queryFn: () => fetchLiveOrders(role, search, page, limit),
    placeholderData: keepPreviousData,
    enabled: !!role,
  });
};

// ── Update order status (admin/owner endpoint) ───────────────────────────────
interface UpdateStatusPayload {
  orderId: string | number;
  status: string;
  role: "owner" | null;
}

const updateOrderStatus = async ({ orderId, status, role }: UpdateStatusPayload) => {
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
      qc.setQueriesData({ queryKey: ["orders"] }, (oldData: OrdersResponse | undefined) => {
        if (!oldData?.orders) return oldData;
        return {
          ...oldData,
          orders: oldData.orders.map((order: Order) =>
            order.id === data.orderId
              ? { ...order, status: data.status }
              : order
          ),
        };
      });
    },
  });
};
