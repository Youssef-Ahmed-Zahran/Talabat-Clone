import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useDriver,
  useApproveDriver,
  useRejectDriver,
  useSuspendDriver,
  useUnsuspendDriver,
  useVerifyDocument,
  useRejectDocument,
} from "../api/driver.api";

export function useDriverDetails() {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();

  const { data: driver, isLoading, isError, refetch } = useDriver(driverId!);

  const approveMutation = useApproveDriver();
  const rejectMutation = useRejectDriver();
  const suspendMutation = useSuspendDriver();
  const unsuspendMutation = useUnsuspendDriver();
  const verifyDocMutation = useVerifyDocument(driverId!);
  const rejectDocMutation = useRejectDocument(driverId!);

  const handleApprove = () => {
    approveMutation.mutate(driverId!, {
      onSuccess: () =>
        toast.success("Driver application approved successfully!"),
      onError: () => toast.error("Failed to approve driver application."),
    });
  };

  const handleReject = () => {
    const reason = window.prompt("Enter rejection reason:");
    if (reason === null) return;
    rejectMutation.mutate(driverId!, {
      onSuccess: () => toast.success("Driver application rejected."),
      onError: () => toast.error("Failed to reject driver application."),
    });
  };

  const handleSuspend = () => {
    if (!window.confirm("Are you sure you want to suspend this driver?"))
      return;
    suspendMutation.mutate(driverId!, {
      onSuccess: () => toast.success("Driver suspended."),
      onError: () => toast.error("Failed to suspend driver."),
    });
  };

  const handleUnsuspend = () => {
    unsuspendMutation.mutate(driverId!, {
      onSuccess: () => toast.success("Driver unsuspended."),
      onError: () => toast.error("Failed to unsuspend driver."),
    });
  };

  const handleVerifyDoc = (docId: string) => {
    verifyDocMutation.mutate(docId, {
      onSuccess: () => toast.success("Document verified."),
      onError: () => toast.error("Failed to verify document."),
    });
  };

  const handleRejectDoc = (docId: string) => {
    const reason = window.prompt("Enter rejection reason for this document:");
    if (reason === null) return;
    rejectDocMutation.mutate(
      { docId, reason },
      {
        onSuccess: () => toast.success("Document rejected."),
        onError: () => toast.error("Failed to reject document."),
      },
    );
  };

  return {
    query: {
      driverId,
      driver,
      isLoading,
      isError,
      refetch,
    },
    actions: {
      handleApprove,
      handleReject,
      handleSuspend,
      handleUnsuspend,
      handleVerifyDoc,
      handleRejectDoc,
    },
    loadingStates: {
      isApproving: approveMutation.isPending,
      isRejecting: rejectMutation.isPending,
      isSuspending: suspendMutation.isPending,
      isUnsuspending: unsuspendMutation.isPending,
    },
    router: {
      navigate,
    },
  };
}
