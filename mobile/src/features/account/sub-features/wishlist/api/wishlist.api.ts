import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@src/config/axios";
import type { ApiResponse } from "@src/types/api.types";
import type { Store } from "@src/features/stores/types/store.types";

// ─── Get Wishlist ─────────────────────────────────────────────
export const useWishlist = (lat?: number | null, lng?: number | null) => {
  return useInfiniteQuery({
    queryKey: ["wishlist", lat ?? null, lng ?? null],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get<ApiResponse<{ wishlist: ({ store: Store; isAvailable: boolean })[], pagination: any }>>("/wishlist", {
        params: {
          page: pageParam,
          limit: 20,
          ...(lat != null && lng != null ? { lat, lng } : {}),
        },
      });
      return res.data.data;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage?.pagination) return undefined;
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });
};


// ─── Toggle Wishlist ──────────────────────────────────────────
export const useToggleWishlist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (storeId: string) => {
      const res = await api.post<ApiResponse<{ isWishlisted: boolean }>>(
        `/wishlist/${storeId}`,
      );
      return res.data.data;
    },
    // ── Optimistic toggle: flip both caches instantly ─────────────
    onMutate: async (storeId) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic state
      await qc.cancelQueries({ queryKey: ["wishlist-status", storeId] });
      await qc.cancelQueries({ queryKey: ["wishlist"] });

      // Snapshot previous values for rollback
      const prevStatus = qc.getQueryData<boolean>(["wishlist-status", storeId]);

      // Flip the single-store status immediately
      qc.setQueryData<boolean>(["wishlist-status", storeId], (old) => !old);

      return { prevStatus, storeId };
    },
    onSettled: async (_data, error, storeId, context) => {
      if (error && context) {
        qc.setQueryData(
          ["wishlist-status", context.storeId],
          context.prevStatus,
        );
      }
      
      // Await the invalidation so that any caller's onSettled waits for the refetch to complete.
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["wishlist"] }),
        qc.invalidateQueries({ queryKey: ["wishlist-status", storeId] })
      ]);
    },
  });
};

// ─── Check Wishlist Status ────────────────────────────────────
export const useCheckWishlistStatus = (storeId: string) => {
  return useQuery({
    queryKey: ["wishlist-status", storeId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ isWishlisted: boolean }>>(
        `/wishlist/check/${storeId}`,
      );
      return res.data.data.isWishlisted;
    },
    enabled: !!storeId,
  });
};

// ─── Clear Wishlist ───────────────────────────────────────────
export const useClearWishlist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.delete<ApiResponse<null>>("/wishlist");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      qc.invalidateQueries({ queryKey: ["wishlist-status"] });
    },
  });
};
