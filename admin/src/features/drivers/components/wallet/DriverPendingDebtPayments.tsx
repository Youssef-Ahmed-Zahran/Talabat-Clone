import { FileText, CheckCircle, XCircle } from "lucide-react";
import {
  useDriverDebtPayments,
  useConfirmDebtPayment,
  useRejectDebtPayment,
} from "../../api/driver.api";
import toast from "react-hot-toast";

interface DebtPayment {
  id: string;
  amount: number | string;
  method: string;
  referenceNumber: string | null;
  createdAt: string;
  status: string;
}

interface Props {
  driverId: string;
}

export function DriverPendingDebtPayments({ driverId }: Props) {
  const { data, isLoading } = useDriverDebtPayments(driverId);
  const confirmMutation = useConfirmDebtPayment(driverId);
  const rejectMutation = useRejectDebtPayment(driverId);

  if (isLoading || !data?.payments || data.payments.length === 0) return null;

  const handleApprove = (paymentId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to approve this payment? This will clear the driver's debt and add to their wallet balance.",
      )
    )
      return;
    confirmMutation.mutate(paymentId, {
      onSuccess: () => toast.success("Payment approved successfully"),
      onError: () => toast.error("Failed to approve payment"),
    });
  };

  const handleReject = (paymentId: string) => {
    const reason = window.prompt("Reason for rejection:");
    if (!reason) return;
    rejectMutation.mutate(
      { paymentId, reason },
      {
        onSuccess: () => toast.success("Payment rejected"),
        onError: () => toast.error("Failed to reject payment"),
      },
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-yellow-200 shadow-sm overflow-hidden mb-8">
      <div className="px-8 py-6 border-b border-yellow-100 flex items-center justify-between bg-yellow-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-xl text-yellow-600">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-yellow-900">
            Pending Payment Requests
          </h3>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {data.payments.map((payment: DebtPayment) => (
          <div
            key={payment.id}
            className="px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {payment.method.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Ref:{" "}
                  <span className="text-gray-900 font-bold">
                    {payment.referenceNumber || "N/A"}
                  </span>
                </p>
                <p className="text-[10px] text-gray-400 font-medium mt-1">
                  {new Date(payment.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-lg font-black text-gray-900">
                  {Number(payment.amount).toLocaleString()} EGP
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(payment.id)}
                  disabled={
                    confirmMutation.isPending || rejectMutation.isPending
                  }
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 font-bold text-xs"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(payment.id)}
                  disabled={
                    confirmMutation.isPending || rejectMutation.isPending
                  }
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold text-xs"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
