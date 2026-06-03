import { useState } from "react";
import toast from "react-hot-toast";
import { useUsers, useBlockUser, useUnblockUser } from "../api/user.api";
import { useDebounce } from "../../../hooks/useDebouncing";
import { handleApiError } from "../../../utils/error";

export function useUsersList() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: response, isLoading, isError, refetch } = useUsers(debouncedSearch, page, limit);
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();

  const handleToggle = (userId: number | string, isActive: boolean) => {
    const idStr = userId.toString();
    if (isActive) {
      blockMutation.mutate(idStr, {
        onSuccess: () => toast.success("User blocked"),
        onError: (err) =>
          handleApiError(err, "We couldn't block this user. Please try again."),
      });
    } else {
      unblockMutation.mutate(idStr, {
        onSuccess: () => toast.success("User unblocked"),
        onError: (err) =>
          handleApiError(
            err,
            "We couldn't unblock this user. Please try again.",
          ),
      });
    }
  };

  const users = response?.users || [];
  const pagination = response?.pagination || null;

  return {
    filters: {
      search,
      setSearch,
      page,
      setPage,
      limit,
    },
    query: {
      users,
      pagination,
      isLoading,
      isError,
      refetch,
    },
    actions: {
      handleToggle,
      isToggling: blockMutation.isPending || unblockMutation.isPending,
    },
  };
}
