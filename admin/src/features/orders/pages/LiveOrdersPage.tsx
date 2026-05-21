import { RefreshCw, Search } from "lucide-react";
import type { Order, OrderStatus } from "../../../types";
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import { useLiveOrdersPage } from "../hooks/useLiveOrdersPage";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
  CONFIRMED: {
    label: "Confirmed",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-400",
  },
  PREPARING: {
    label: "Preparing",
    bg: "bg-orange-50",
    text: "text-orange-700",
    dot: "bg-orange-400",
  },
  WAITING_FOR_DRIVER: {
    label: "Awaiting Driver",
    bg: "bg-purple-50",
    text: "text-purple-700",
    dot: "bg-purple-400",
  },
  PICKED_UP: {
    label: "Picked Up",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    dot: "bg-cyan-400",
  },
  ON_THE_WAY: {
    label: "On the Way",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    dot: "bg-indigo-400",
  },
  DELIVERED: {
    label: "Delivered",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-400",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-red-50",
    text: "text-red-600",
    dot: "bg-red-400",
  },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
      {c.label}
    </span>
  );
}

export default function LiveOrdersPage() {
  const {
    orders,
    isLoading,
    isError,
    refetch,
    isFetching,
    searchTerm,
    setSearchTerm,
    handleStatusChange,
    isUpdating,
  } = useLiveOrdersPage();

  if (isLoading && !orders) return <PageLoader />;
  if (isError) return <ErrorFallback onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Live Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time monitoring • Auto-refreshes every 15s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
            <input
              type="text"
              placeholder="Search by ID or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all w-64 shadow-sm"
            />
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50/80 border border-emerald-100 rounded-xl">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="text-[13px] text-emerald-700 font-medium">
          {orders?.length || 0} active orders
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Order
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Customer
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Store
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Driver
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Status
              </th>
              <th className="text-right px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Total
              </th>
              <th className="text-right px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders && orders.length > 0 ? (
              orders.map((o: Order) => (
                <tr
                  key={o.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    #{o.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {o.user?.fullName || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {o.store?.name || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {o.delivery?.driver ? (
                      `${o.delivery.driver.application?.firstName ?? ""} ${o.delivery.driver.application?.familyName ?? ""}`.trim()
                    ) : (
                      <span className="text-gray-300">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    EGP {Number(o.totalAmount || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      disabled={isUpdating}
                      className="text-[12px] font-medium bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
                    >
                      {Object.keys(STATUS_CONFIG).map((status) => (
                        <option key={status} value={status}>
                          {STATUS_CONFIG[status as OrderStatus].label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-16 text-center text-sm text-gray-400"
                >
                  No active orders
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

