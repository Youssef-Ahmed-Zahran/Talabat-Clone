import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useLiveOrders, useUpdateOrderStatus } from "../api/order.api";
import { useDebounce } from "../../../hooks/useDebouncing";
import { getNotificationSocket } from "../../../config/socket";
import { handleApiError } from "../../../utils/error";
import { useAuthStore } from "../../../store/authStore";

export function useLiveOrdersPage() {
  const role = useAuthStore((s) => s.role);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const limit = 10;

  const {
    data: response,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useLiveOrders(role, debouncedSearch, page, limit);

  const orders = response?.orders || [];
  const pagination = response?.pagination || null;

  const { mutate: updateStatus, isPending: isUpdating } =
    useUpdateOrderStatus();

  // ── Listen for Real-Time Socket Notifications ──
  useEffect(() => {
    const socket = getNotificationSocket();
    if (!socket) return;

    const handleNewNotification = (data: {
      notification: { type: string };
    }) => {
      const { notification } = data;
      if (notification?.type === "ORDER_UPDATE") {
        refetch();
      }
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [refetch]);

  const handleStatusChange = (orderId: string | number, status: string) => {
    updateStatus(
      { orderId, status, role },
      {
        onSuccess: () => {
          toast.success(`Order #${orderId} status updated to ${status}`);
        },
        onError: (err: unknown) => {
          handleApiError(
            err,
            "We couldn't update the order status. Please try again.",
          );
        },
      },
    );
  };

  return {
    query: {
      orders,
      pagination,
      isLoading,
      isError,
      refetch,
      isFetching,
    },
    filters: {
      searchTerm,
      setSearchTerm,
      page,
      setPage,
      limit,
    },
    actions: {
      handleStatusChange,
      isUpdating,
    },
  };
}
