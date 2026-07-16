import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import api from "@config/axios";
import type { ApiResponse } from "@src/types/api.types";
import type { Period } from "../types/earnings.types";

// ─── Query Keys ───────────────────────────────────────────────
export const EARNINGS_KEYS = {
  all: ["driver", "earnings"] as const,
  byPeriod: (period: Period) => ["driver", "earnings", period] as const,
};

// ─── Earnings Infinite Query ───────────────────────────────────
export const useEarningsQuery = (period: Period) => {
  return useInfiniteQuery({
    queryKey: EARNINGS_KEYS.byPeriod(period),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get<ApiResponse<any>>(
        `/drivers/earnings?page=${pageParam}&limit=20&period=${period}`,
      );
      return res.data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });
};
