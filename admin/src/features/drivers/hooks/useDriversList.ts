import { useState } from "react";
import toast from "react-hot-toast";
import {
  useDrivers,
  useApproveDriver,
  useRejectDriver,
  useSuspendDriver,
  useUnsuspendDriver,
  useDeleteDriver,
} from "../api/driver.api";
import { useDebounce } from "../../../hooks/useDebouncing";
import type { Driver } from "../../../types";
import { handleApiError } from "../../../utils/error";

export function useDriversList() {
  const { data: driversData, isLoading, isError, refetch } = useDrivers();
  const approveMutation = useApproveDriver();
  const rejectMutation = useRejectDriver();
  const suspendMutation = useSuspendDriver();
  const unsuspendMutation = useUnsuspendDriver();
  const deleteMutation = useDeleteDriver();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const handleApprove = (id: string) => {
    approveMutation.mutate(id, {
      onSuccess: () => toast.success("Driver approved"),
      onError: (err) =>
        handleApiError(
          err,
          "We couldn't approve the driver application. Please try again.",
        ),
    });
  };

  const handleReject = (id: string) => {
    rejectMutation.mutate(id, {
      onSuccess: () => toast.success("Driver rejected"),
      onError: (err) =>
        handleApiError(
          err,
          "We couldn't reject the driver application. Please try again.",
        ),
    });
  };

  const handleSuspend = (id: string) => {
    if (
      !window.confirm(
        "Suspend this driver? They will be taken offline immediately.",
      )
    )
      return;
    suspendMutation.mutate(id, {
      onSuccess: () => toast.success("Driver suspended"),
      onError: (err) =>
        handleApiError(
          err,
          "We couldn't suspend the driver. Please try again.",
        ),
    });
  };

  const handleUnsuspend = (id: string) => {
    unsuspendMutation.mutate(id, {
      onSuccess: () => toast.success("Driver unsuspended"),
      onError: (err) =>
        handleApiError(
          err,
          "We couldn't unsuspend the driver. Please try again.",
        ),
    });
  };

  const handleDelete = (id: string) => {
    if (
      !window.confirm(
        "Permanently delete this driver? This action cannot be undone.",
      )
    )
      return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Driver deleted"),
      onError: (err) =>
        handleApiError(err, "We couldn't delete the driver. Please try again."),
    });
  };

  const filtered = driversData?.drivers?.filter(
    (d: Driver) =>
      (d.email || "").toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (d.phone || "").includes(debouncedSearch),
  );

  return {
    drivers: filtered,
    isLoading,
    isError,
    refetch,
    search,
    setSearch,
    handleApprove,
    handleReject,
    handleSuspend,
    handleUnsuspend,
    handleDelete,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isSuspending: suspendMutation.isPending,
    isUnsuspending: unsuspendMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
