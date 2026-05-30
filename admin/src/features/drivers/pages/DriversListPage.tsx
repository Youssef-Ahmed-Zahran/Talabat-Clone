import { Search } from "lucide-react";
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import { DriversTable } from "../components/table/DriversTable";
import { useDriversList } from "../hooks/useDriversList";

export default function DriversListPage() {
  const { filters, query, actions } = useDriversList();

  if (query.isLoading) return <PageLoader />;
  if (query.isError) return <ErrorFallback onRetry={query.refetch} />;

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
          value={filters.search}
          onChange={(e) => filters.setSearch(e.target.value)}
          placeholder="Search drivers…"
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl placeholder:text-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
        />
      </div>

      <DriversTable
        drivers={query.drivers}
        onApprove={actions.handleApprove}
        onReject={actions.handleReject}
        onSuspend={actions.handleSuspend}
        onUnsuspend={actions.handleUnsuspend}
        onDelete={actions.handleDelete}
        isApproving={actions.isApproving}
        isRejecting={actions.isRejecting}
        isSuspending={actions.isSuspending}
        isUnsuspending={actions.isUnsuspending}
        isDeleting={actions.isDeleting}
      />
    </div>
  );
}
