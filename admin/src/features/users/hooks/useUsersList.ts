import { useState } from "react";
import toast from "react-hot-toast";
import { useUsers, useBlockUser, useUnblockUser } from "../api/user.api";
import { useDebounce } from "../../../hooks/useDebouncing";
import type { User } from "../../../types";
import { handleApiError } from "../../../utils/error";

export function useUsersList() {
  const { data: usersData, isLoading, isError, refetch } = useUsers();
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

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

  const filtered = usersData?.users?.filter(
    (u: User) =>
      (u.fullName || "")
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  return {
    filters: {
      search,
      setSearch,
    },
    query: {
      users: filtered,
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
