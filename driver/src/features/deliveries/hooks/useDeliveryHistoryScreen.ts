import { useDeliveryHistoryQuery } from "../api/deliveries.api";

export interface EarningRow {
  id: string;
  orderId: string;
  baseAmount: number;
  tipAmount: number;
  totalAmount: number;
  createdAt: string;
  order: { id: string; createdAt: string };
}

export function useDeliveryHistoryScreen() {
  const historyQuery = useDeliveryHistoryQuery();

  const earnings: EarningRow[] = historyQuery.data?.pages.flatMap((page) => page.earnings) ?? [];
  const summary = historyQuery.data?.pages[0]?.summary ?? {};
  const pagination = historyQuery.data?.pages[0]?.pagination ?? {};

  return {
    query: {
      earnings,
      summary,
      pagination,
      isLoading: historyQuery.isLoading,
      isRefetching: historyQuery.isRefetching,
      isFetchingNextPage: historyQuery.isFetchingNextPage,
      hasNextPage: historyQuery.hasNextPage,
    },
    state: {},
    modal: {},
    actions: {
      refetch: historyQuery.refetch,
      fetchNextPage: historyQuery.fetchNextPage,
    },
  };
}

