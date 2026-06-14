import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import api from '@src/config/axios';
import type { ApiResponse } from '@src/types/api.types';
import type { Review, StoreReviewsResponse } from '../types/review.types';

// ─── Get Store Reviews ────────────────────────────────────────
export const useStoreReviews = (storeId: string, page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['reviews', storeId, page, limit],
    queryFn: async () => {
      const res = await api.get<ApiResponse<StoreReviewsResponse>>(
        `/reviews/stores/${storeId}`,
        { params: { page, limit } },
      );
      return res.data.data;
    },
    enabled: !!storeId,
  });
};

// ─── Get Store Reviews (Infinite) ─────────────────────────────
export const useInfiniteStoreReviews = (storeId: string, limit: number = 10) => {
  return useInfiniteQuery({
    queryKey: ['reviews', storeId, 'infinite', limit],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get<ApiResponse<StoreReviewsResponse>>(
        `/reviews/stores/${storeId}`,
        { params: { page: pageParam, limit } },
      );
      return res.data.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!storeId,
  });
};

// ─── Create Review ────────────────────────────────────────────
export const useCreateReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      storeId,
      orderId,
      rating,
      comment,
    }: {
      storeId: string;
      orderId: string;
      rating: number;
      comment?: string;
    }) => {
      const res = await api.post<ApiResponse<Review>>(
        `/reviews/stores/${storeId}/orders/${orderId}`,
        { rating, comment },
      );
      return res.data.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['reviews', variables.storeId] });
      qc.invalidateQueries({ queryKey: ['store', variables.storeId] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

// ─── Delete Review ────────────────────────────────────────────
export const useDeleteReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, storeId }: { reviewId: string; storeId: string }) => {
      const res = await api.delete<ApiResponse<null>>(`/reviews/${reviewId}`);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['reviews', variables.storeId] });
      qc.invalidateQueries({ queryKey: ['store', variables.storeId] });
    },
  });
};
