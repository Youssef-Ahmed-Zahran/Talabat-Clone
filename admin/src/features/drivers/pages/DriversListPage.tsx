import { Search } from "lucide-react";
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
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import { DriversTable } from "../components/DriversTable";
import { handleApiError } from "../../../utils/error";

export default function DriversListPage() {
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

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorFallback onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Drivers
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage driver applications and fleet
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search drivers…"
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl placeholder:text-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
        />
      </div>

      <DriversTable
        drivers={filtered}
        onApprove={handleApprove}
        onReject={handleReject}
        onSuspend={handleSuspend}
        onUnsuspend={handleUnsuspend}
        onDelete={handleDelete}
        isApproving={approveMutation.isPending}
        isRejecting={rejectMutation.isPending}
        isSuspending={suspendMutation.isPending}
        isUnsuspending={unsuspendMutation.isPending}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
