import { useState } from "react";
import {
  useWalletDetailsQuery,
  useWalletTransactionsQuery,
  useWalletPaymentsQuery,
} from "../api/wallet.api";

export function useWalletScreen() {
  const [activeTab, setActiveTab] = useState<"transactions" | "payments">("transactions");

  const detailsQuery = useWalletDetailsQuery();
  const txQuery = useWalletTransactionsQuery();
  const payQuery = useWalletPaymentsQuery();

  const wallet = detailsQuery.data?.wallet ?? null;
  const balance = wallet ? Number(wallet.balance) : 0;
  const debt = balance < 0 ? Math.abs(balance) : 0;
  const hasDebt = balance < 0;
  const isSuspended = detailsQuery.data?.isSuspended ?? false;

  const isTransactions = activeTab === "transactions";
  const data = isTransactions
    ? txQuery.data?.pages.flatMap((page) => page.transactions) ?? []
    : payQuery.data?.pages.flatMap((page) => page.payments) ?? [];

  const isLoading = detailsQuery.isLoading;
  const isRefetching =
    detailsQuery.isRefetching || txQuery.isRefetching || payQuery.isRefetching;

  const handleRefresh = () => {
    detailsQuery.refetch();
    if (isTransactions) txQuery.refetch();
    else payQuery.refetch();
  };

  const handleEndReached = () => {
    if (isTransactions && txQuery.hasNextPage) txQuery.fetchNextPage();
    if (!isTransactions && payQuery.hasNextPage) payQuery.fetchNextPage();
  };

  const isFetchingNextPage = isTransactions
    ? txQuery.isFetchingNextPage
    : payQuery.isFetchingNextPage;

  return {
    query: {
      wallet,
      balance,
      debt,
      hasDebt,
      isSuspended,
      data,
      isLoading,
      isRefetching,
      isFetchingNextPage,
    },
    state: {
      activeTab,
      setActiveTab,
      isTransactions,
    },
    modal: {},
    actions: {
      handleRefresh,
      handleEndReached,
    },
  };
}
