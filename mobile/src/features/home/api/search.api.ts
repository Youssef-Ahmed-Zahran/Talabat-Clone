import { useQuery } from "@tanstack/react-query";
import api from "@src/config/axios";
import type { ApiResponse } from "@src/types/api.types";
import type { Store } from "@src/features/stores/types/store.types";
import { SearchProduct, SearchResult } from "../types/home.types";

// ── Types ──────────────────────────────────────────────────────// ── Hook ───────────────────────────────────────────────────────
export const useSearch = (
  query: string,
  lat?: number | null,
  lng?: number | null,
) => {
  return useQuery({
    queryKey: ["search", query, lat, lng],
    queryFn: async (): Promise<SearchResult> => {
      const params: Record<string, string> = { q: query, limit: "20" };
      if (lat != null) params.lat = String(lat);
      if (lng != null) params.lng = String(lng);

      const res = await api.get<ApiResponse<SearchResult>>("/stores/search", {
        params,
      });
      return res.data.data;
    },
    enabled: query.trim().length >= 2,
    staleTime: 60_000,
    placeholderData: undefined,
  });
};
