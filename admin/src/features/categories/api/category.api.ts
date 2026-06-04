import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../../../config/axios';
import type {
  Category,
  CreateCategoryPayload,
  CreateSubCategoryPayload,
  LinkStorePayload,
} from '../../../types';

export interface MainCategoriesResponse {
  categories: Category[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ── Fetch all main categories ──────────────────────────────────────────
const fetchMainCategories = async (page?: number, limit?: number, search?: string): Promise<MainCategoriesResponse> => {
  const { data } = await api.get('/categories', { params: { page, limit, search } });
  return data.data ?? data;
};

export const useMainCategories = (page?: number, limit?: number, search?: string) => {
  return useQuery({
    queryKey: ['categories', 'main', page, limit, search],
    queryFn: () => fetchMainCategories(page, limit, search),
    placeholderData: keepPreviousData,
  });
};

// ── Fetch sub-categories for a main category ───────────────────────────
const fetchSubCategories = async (mainId: string): Promise<Category[]> => {
  const { data } = await api.get(`/categories/${mainId}/sub-categories`);
  return data.data ?? data;
};

export const useSubCategories = (mainId: string) => {
  return useQuery({
    queryKey: ['categories', 'sub', mainId],
    queryFn: () => fetchSubCategories(mainId),
    enabled: !!mainId,
  });
};


const createCategory = async (payload: CreateCategoryPayload): Promise<Category> => {
  const { data } = await api.post('/categories', payload);
  return data.data ?? data;
};

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

// ── Update main category ───────────────────────────────────────────────
export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ categoryId, ...payload }: CreateCategoryPayload & { categoryId: string }) => {
      const { data } = await api.put(`/categories/${categoryId}`, payload);
      return data.data ?? data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

// ── Delete main category ───────────────────────────────────────────────
export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (categoryId: string) => {
      const { data } = await api.delete(`/categories/${categoryId}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};


const createSubCategory = async (payload: CreateSubCategoryPayload): Promise<Category> => {
  const { data } = await api.post(`/categories/${payload.parentId}/sub-categories`, payload);
  return data.data ?? data;
};

export const useCreateSubCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSubCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', 'sub'] });
    },
  });
};

// ── Update sub-category ────────────────────────────────────────────────
export const useUpdateSubCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ subCategoryId, ...payload }: { subCategoryId: string; name: string; image?: string }) => {
      const { data } = await api.put(`/categories/sub-categories/${subCategoryId}`, payload);
      return data.data ?? data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', 'sub'] });
    },
  });
};

// ── Delete sub-category ────────────────────────────────────────────────
export const useDeleteSubCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (subCategoryId: string) => {
      const { data } = await api.delete(`/categories/sub-categories/${subCategoryId}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', 'sub'] });
    },
  });
};


const linkStore = async ({ subCategoryId, storeId }: LinkStorePayload) => {
  const { data } = await api.post(`/categories/sub-categories/${subCategoryId}/stores`, { storeId });
  return data;
};

export const useLinkStore = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: linkStore,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['stores'] });
    },
  });
};

// ── Unlink store from sub-category ─────────────────────────────────────
export const useUnlinkStore = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ subCategoryId, storeId }: LinkStorePayload) => {
      const { data } = await api.delete(`/categories/sub-categories/${subCategoryId}/stores/${storeId}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['stores'] });
    },
  });
};

// ── Get stores in sub-category ─────────────────────────────────────────
export const useStoresInSubCategory = (subCategoryId: string | null) => {
  return useQuery({
    queryKey: ['categories', 'sub', subCategoryId, 'stores'],
    queryFn: async () => {
      if (!subCategoryId) return { stores: [] };
      const { data } = await api.get(`/categories/sub-categories/${subCategoryId}/stores/all`);
      return data.data ?? data;
    },
    enabled: !!subCategoryId,
  });
};
