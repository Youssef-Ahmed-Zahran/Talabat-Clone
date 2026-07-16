import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import api from "@src/config/axios";
import type { Store } from "@src/features/stores/types/store.types";
import type { ApiResponse } from "@src/types/api.types";

// ─── Get Nearby Stores (Zone-Based) ───────────────────────────
export const useNearbyStores = (
  lat?: number | null,
  lng?: number | null,
  mainCategoryId?: string | null,
  subCategoryId?: string | null,
) => {
  return useInfiniteQuery({
    queryKey: ["stores", "nearby", lat, lng, mainCategoryId, subCategoryId],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const res = await api.get("/stores/nearby", {
          params: {
            lat,
            lng,
            page: pageParam,
            limit: 30,
            ...(mainCategoryId ? { mainCategoryId } : {}),
            ...(subCategoryId ? { subCategoryId } : {}),
          },
        });
        // New response shape: { stores, pagination, zone, userLocation }
        const data = res.data.data;
        return {
          stores: (data.stores ?? []) as Store[],
          pagination: data.pagination,
          zone: data.zone as {
            id: string;
            name: string;
            color?: string;
          } | null,
          outsideZone: false,
        };
      } catch (err: any) {
        if (err?.response?.status === 404) {
          // Outside all delivery zones
          return { stores: [] as Store[], pagination: null, zone: null, outsideZone: true };
        }
        throw err;
      }
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination) return undefined;
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: lat != null && lng != null,
  });
};

// ─── Get All Stores ───────────────────────────────────────────
export const useAllStores = () => {
  return useQuery({
    queryKey: ["stores", "all"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ stores: Store[] }>>("/stores");
      return res.data.data.stores;
    },
  });
};

// ─── Get Store by ID ──────────────────────────────────────────
export const useStoreById = (storeId: string) => {
  return useQuery({
    queryKey: ["store", storeId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Store>>(`/stores/${storeId}`);
      return res.data.data;
    },
    enabled: !!storeId,
  });
};
