import { useQuery } from '@tanstack/react-query';
import api from '@src/config/axios';
import type { StoreSection, Product } from '@src/features/stores/types/store.types';
import type { ApiResponse } from '@src/types/api.types';

// ─── Get Store Sections (menu) ────────────────────────────────
export const useStoreSections = (storeId: string) => {
  return useQuery({
    queryKey: ['catalog', 'sections', storeId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<StoreSection[]>>(
        `/catalog/${storeId}/sections`
      );
      return res.data.data;
    },
    enabled: !!storeId,
  });
};

// ─── Get Store Products ───────────────────────────────────────
export const useStoreProducts = (storeId: string) => {
  return useQuery({
    queryKey: ['catalog', 'products', storeId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Product[]>>(
        `/catalog/${storeId}/products`
      );
      return res.data.data;
    },
    enabled: !!storeId,
  });
};

// ─── Get Product by ID ───────────────────────────────────────
export const useProductById = (storeId: string, productId: string) => {
  return useQuery({
    queryKey: ['catalog', 'product', storeId, productId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Product>>(
        `/catalog/${storeId}/products/${productId}`
      );
      return res.data.data;
    },
    enabled: !!storeId && !!productId,
  });
};
