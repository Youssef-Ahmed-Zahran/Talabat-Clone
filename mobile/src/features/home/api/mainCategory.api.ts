import { useQuery } from "@tanstack/react-query";
import api from "@src/config/axios";
import type { MainCategory } from "@src/features/stores/types/store.types";
import type { ApiResponse } from "@src/types/api.types";

// ─── Get All Main Categories ─────────────────────────────────
export const useMainCategories = () => {
  return useQuery({
    queryKey: ["mainCategories"],
    queryFn: async () => {
      const res =
        await api.get<ApiResponse<{ categories: MainCategory[] }>>(
          "/categories",
        );
      return res.data.data.categories;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes — categories rarely change
  });
};

// ─── Get Sub Categories ──────────────────────────────────────
export const useSubCategories = (mainCategoryId?: string | null) => {
  return useQuery({
    queryKey: ["subCategories", mainCategoryId],
    queryFn: async () => {
      if (!mainCategoryId) return [];
      // Any SubCategory interface will just use standard fields { id, name, imageUrl }
      const res = await api.get(`/categories/${mainCategoryId}/sub-categories`);
      return res.data.data;
    },
    enabled: !!mainCategoryId,
    staleTime: 1000 * 60 * 10,
  });
};
