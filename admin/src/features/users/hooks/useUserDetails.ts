import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useUser,
  useUserOrders,
  useBlockUser,
  useUnblockUser,
} from "../api/user.api";

export function useUserDetails() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError,
    refetch: refetchUser,
  } = useUser(userId!);

  const {
    data: orders,
    isLoading: isOrdersLoading,
    isError: isOrdersError,
    refetch: refetchOrders,
  } = useUserOrders(userId!);

  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();

  const handleToggleBlock = () => {
    if (!user) return;
    const idStr = user.id.toString();
    if (!user.isBlocked) {
      blockMutation.mutate(idStr, {
        onSuccess: () => {
          toast.success("User blocked successfully");
          refetchUser();
        },
        onError: () => toast.error("Failed to block user"),
      });
    } else {
      unblockMutation.mutate(idStr, {
        onSuccess: () => {
          toast.success("User unblocked successfully");
          refetchUser();
        },
        onError: () => toast.error("Failed to unblock user"),
      });
    }
  };

  return {
    user,
    orders,
    isUserLoading,
    isUserError,
    refetchUser,
    isOrdersLoading,
    isOrdersError,
    refetchOrders,
    handleToggleBlock,
    isPendingToggle: blockMutation.isPending || unblockMutation.isPending,
    navigate,
  };
}
