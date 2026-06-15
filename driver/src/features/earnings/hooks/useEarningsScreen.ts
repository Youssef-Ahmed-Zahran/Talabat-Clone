import { useState } from "react";
import type { Earning, Period } from "../types/earnings.types";
import { useEarningsQuery } from "../api/earnings.api";

export function useEarningsScreen() {
  const [period, setPeriod] = useState<Period>("week");

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEarningsQuery(period);

  const earnings: Earning[] = data?.pages.flatMap((page) => page.earnings) ?? [];
  const summary = data?.pages[0]?.summary ?? {
    totalAmount: 0,
    tipAmount: 0,
    baseAmount: 0,
  };
  const totalDeliveries = data?.pages[0]?.pagination?.total ?? 0;

  return {
    query: {
      earnings,
      summary,
      totalDeliveries,
      isLoading,
      isRefetching,
      isFetchingNextPage,
      hasNextPage,
    },
    state: {
      period,
      setPeriod,
    },
    modal: {},
    actions: {
      refetch,
      fetchNextPage,
    },
  };
}

