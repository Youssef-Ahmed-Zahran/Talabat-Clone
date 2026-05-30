import {
  Truck,
  Eye,
  CheckCircle,
  XCircle,
  ShieldOff,
  ShieldCheck,
  Trash2,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Driver, DriverStatus } from "../../../../types";

const STATUS_BADGE: Record<
  DriverStatus,
  { bg: string; text: string; dot: string }
> = {
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  APPROVED: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  REJECTED: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
  SUSPENDED: { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
};

const ONLINE_BADGE: Record<string, { bg: string; text: string; dot: string }> =
  {
    ONLINE: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-400",
    },
    OFFLINE: { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-300" },
    ON_DELIVERY: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      dot: "bg-blue-400",
    },
    SUSPENDED: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
  };

function OnlineStatusBadge({ status }: { status: string }) {
  const c = ONLINE_BADGE[status] ?? ONLINE_BADGE.OFFLINE;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

interface DriversTableProps {
  drivers?: Driver[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSuspend: (id: string) => void;
  onUnsuspend: (id: string) => void;
  onDelete: (id: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
  isSuspending: boolean;
  isUnsuspending: boolean;
  isDeleting: boolean;
}

export function DriversTable({
  drivers,
  onApprove,
  onReject,
  onSuspend,
  onUnsuspend,
  onDelete,
  isApproving,
  isRejecting,
  isSuspending,
  isUnsuspending,
  isDeleting,
}: DriversTableProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-50">
            <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Driver
            </th>
            <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Vehicle
            </th>
            <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Status
            </th>
            <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Deliveries
            </th>
            <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Rating
            </th>
            <th className="text-right px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {drivers && drivers.length > 0 ? (
            drivers.map((d) => {
              const appStatus = d.application?.status;
              const vehicleType = d.application?.vehicleType;
              const deliveryCount = d._count?.deliveries ?? 0;
              const driverName = d.application
                ? `${d.application.firstName ?? ""} ${d.application.familyName ?? ""}`.trim()
                : null;

              return (
                <tr
                  key={d.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand/10 to-brand/20 flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4 text-brand" />
                      </div>
                      <div>
                        {driverName && (
                          <p className="text-sm font-semibold text-gray-900">
                            {driverName}
                          </p>
                        )}
                        <p className="text-[12px] text-gray-500">{d.email}</p>
                        <p className="text-[11px] text-gray-400">
                          {d.phone || "No phone"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                    {vehicleType ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {appStatus && (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold w-fit ${STATUS_BADGE[appStatus]?.bg} ${STATUS_BADGE[appStatus]?.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${STATUS_BADGE[appStatus]?.dot}`}
                          />
                          {appStatus}
                        </span>
                      )}
                      <OnlineStatusBadge status={d.status} />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                    {deliveryCount}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {d.rating ? `${Number(d.rating).toFixed(1)} ★` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <button
                        onClick={() => navigate(`/drivers/${d.id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                      {appStatus === "PENDING" && (
                        <>
                          <button
                            onClick={() => onApprove(d.id.toString())}
                            disabled={isApproving}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-60"
                          >
                            {isApproving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => onReject(d.id.toString())}
                            disabled={isRejecting}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-60"
                          >
                            {isRejecting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            Reject
                          </button>
                        </>
                      )}
                      {d.status !== "SUSPENDED" ? (
                        <button
                          onClick={() => onSuspend(d.id.toString())}
                          disabled={isSuspending}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-60"
                          title="Suspend Driver"
                        >
                          {isSuspending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ShieldOff className="w-3.5 h-3.5" />
                          )}
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => onUnsuspend(d.id.toString())}
                          disabled={isUnsuspending}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-60"
                          title="Unsuspend Driver"
                        >
                          {isUnsuspending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                          Unsuspend
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(d.id.toString())}
                        disabled={isDeleting}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Driver"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={6}
                className="px-6 py-16 text-center text-sm text-gray-400"
              >
                No drivers found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
