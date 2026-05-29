import {
  ArrowLeft,
  ShieldCheck,
  ShieldOff,
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
} from "lucide-react";
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import type { DriverStatus } from "../../../types";
import { DriverProfileCard } from "../components/DriverProfileCard";
import { DriverApplicationDetails } from "../components/DriverApplicationDetails";
import { DriverDocumentsList } from "../components/DriverDocumentsList";
import { DriverWalletDetails } from "../components/DriverWalletDetails";
import { useDriverDetails } from "../hooks/useDriverDetails";

const APP_STATUS_CONFIG: Record<
  DriverStatus,
  { label: string; bg: string; text: string; icon: React.ElementType }
> = {
  PENDING: {
    label: "Pending Review",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Rejected",
    bg: "bg-red-50",
    text: "text-red-700",
    icon: XCircle,
  },
  SUSPENDED: {
    label: "Suspended",
    bg: "bg-gray-100",
    text: "text-gray-600",
    icon: ShieldOff,
  },
};

const ONLINE_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  ONLINE: {
    label: "Online",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  OFFLINE: {
    label: "Offline",
    bg: "bg-gray-50",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
  ON_DELIVERY: {
    label: "On Delivery",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  SUSPENDED: {
    label: "Suspended",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
};

export default function DriverDetailsPage() {
  const { query, actions, loadingStates, router } = useDriverDetails();

  if (query.isLoading) return <PageLoader />;
  if (query.isError || !query.driver) return <ErrorFallback onRetry={query.refetch} />;

  const application = query.driver.application;
  const appStatus = application?.status || "PENDING";
  const appCfg = APP_STATUS_CONFIG[appStatus];
  const onlineCfg =
    ONLINE_STATUS_CONFIG[query.driver.status] || ONLINE_STATUS_CONFIG.OFFLINE;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.navigate("/drivers")}
          className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <div className="p-2 bg-white border border-gray-100 rounded-lg group-hover:border-gray-200 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Drivers
        </button>

        <div className="flex items-center gap-3">
          {appStatus === "PENDING" && (
            <>
              <button
                onClick={actions.handleApprove}
                disabled={loadingStates.isApproving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Approve Application
              </button>
              <button
                onClick={actions.handleReject}
                disabled={loadingStates.isRejecting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </>
          )}

          {query.driver.status !== "SUSPENDED" ? (
            <button
              onClick={actions.handleSuspend}
              disabled={loadingStates.isSuspending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-600 bg-amber-50 rounded-xl hover:bg-amber-100 transition-all disabled:opacity-50"
            >
              <ShieldOff className="w-4 h-4" />
              Suspend Driver
            </button>
          ) : (
            <button
              onClick={actions.handleUnsuspend}
              disabled={loadingStates.isUnsuspending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              Unsuspend Driver
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <DriverProfileCard
          driver={query.driver}
          appCfg={appCfg}
          onlineCfg={onlineCfg}
        />

        <div className="lg:col-span-2 space-y-8">
          <DriverApplicationDetails driver={query.driver} />
          <DriverDocumentsList
            documents={query.driver.documents}
            onVerify={actions.handleVerifyDoc}
            onReject={actions.handleRejectDoc}
          />
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-gray-900 text-white rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
              Financial Management (Wallet)
            </h3>
            <DriverWalletDetails driverId={query.driverId!} />
          </div>
        </div>
      </div>
    </div>
  );
}
