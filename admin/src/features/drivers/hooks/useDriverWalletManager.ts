import { useState } from "react";
import toast from "react-hot-toast";
import {
  useTopUpWallet,
  useDebitWallet,
  useUpdateCreditLimit,
  useDriverWalletTransactions,
} from "../api/driver.api";

type ModalState =
  | { type: "NONE" }
  | { type: "TOP_UP" }
  | { type: "DEBIT" }
  | { type: "LIMIT" };

export function useDriverWalletManager(driverId: string) {
  // Single source of truth — the infinite query owns both wallet metadata
  // AND the paginated transactions. No second /wallet call needed.
  const infiniteTransactionsQuery = useDriverWalletTransactions(driverId);

  const topUpMutation = useTopUpWallet(driverId);
  const debitMutation = useDebitWallet(driverId);
  const updateLimitMutation = useUpdateCreditLimit(driverId);

  const [modalState, setModalState] = useState<ModalState>({ type: "NONE" });
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [limit, setLimit] = useState("");

  const closeModal = () => {
    setModalState({ type: "NONE" });
    setAmount("");
    setNote("");
    setLimit("");
  };

  const openTopUp = () => setModalState({ type: "TOP_UP" });
  const openDebit = () => setModalState({ type: "DEBIT" });
  const openLimit = () => setModalState({ type: "LIMIT" });

  const handleTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return toast.error("Invalid amount");

    topUpMutation.mutate(
      { driverId, amount: Number(amount), note },
      {
        onSuccess: () => {
          toast.success("Wallet topped up successfully");
          closeModal();
        },
        onError: () => toast.error("Failed to top up wallet"),
      },
    );
  };

  const handleDebit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return toast.error("Invalid amount");

    debitMutation.mutate(
      { driverId, amount: Number(amount), note },
      {
        onSuccess: () => {
          toast.success("Wallet debited successfully");
          closeModal();
        },
        onError: () => toast.error("Failed to debit wallet"),
      },
    );
  };

  const handleUpdateLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!limit || isNaN(Number(limit))) return toast.error("Invalid limit");

    updateLimitMutation.mutate(
      { driverId, creditLimit: Number(limit) },
      {
        onSuccess: () => {
          toast.success("Credit limit updated");
          closeModal();
        },
        onError: () => toast.error("Failed to update credit limit"),
      },
    );
  };

  return {
    infiniteTransactionsQuery,
    modal: {
      state: modalState,
      close: closeModal,
      openTopUp,
      openDebit,
      openLimit,
    },
    form: {
      amount,
      setAmount,
      note,
      setNote,
      limit,
      setLimit,
    },
    actions: {
      handleTopUp,
      handleDebit,
      handleUpdateLimit,
      isToppingUp: topUpMutation.isPending,
      isDebiting: debitMutation.isPending,
      isUpdatingLimit: updateLimitMutation.isPending,
    },
  };
}
