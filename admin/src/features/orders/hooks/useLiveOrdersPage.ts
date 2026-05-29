import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useLiveOrders, useUpdateOrderStatus } from "../api/order.api";
import { useDebounce } from "../../../hooks/useDebouncing";
import { getNotificationSocket } from "../../../config/socket";
import { handleApiError } from "../../../utils/error";

export function useLiveOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data: orders,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useLiveOrders(debouncedSearch);

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
      { orderId, status },
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
      isLoading,
      isError,
      refetch,
      isFetching,
    },
    filters: {
      searchTerm,
      setSearchTerm,
    },
    actions: {
      handleStatusChange,
      isUpdating,
    },
  };
}
