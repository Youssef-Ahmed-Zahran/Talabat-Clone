import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import api from "../../../config/axios";
import type {
  Section,
  Product,
  OptionGroup,
  CreateSectionPayload,
  UpdateSectionPayload,
  CreateProductPayload,
  UpdateProductPayload,
  CreateOptionGroupPayload,
  UpdateOptionGroupPayload,
  CreateOptionValuePayload,
  UpdateOptionValuePayload,
  PaginatedListResponse,
} from "../../../types";

// ═══════════════════════════════════════════════════════════════
// SECTIONS
// ═══════════════════════════════════════════════════════════════

const fetchSections = async (storeId: string): Promise<Section[]> => {
  const { data } = await api.get(`/catalog/${storeId}/sections`);
  return data.data ?? data;
};

export const useSections = (storeId: string) =>
  useQuery({
    queryKey: ["catalog", "sections", storeId],
    queryFn: () => fetchSections(storeId),
    enabled: !!storeId,
  });

export const useCreateSection = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSectionPayload) =>
      api
        .post(`/catalog/${storeId}/sections`, payload)
        .then((r) => r.data.data ?? r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["catalog", "sections", storeId] }),
  });
};

export const useUpdateSection = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sectionId,
      ...payload
    }: UpdateSectionPayload & { sectionId: string }) =>
      api
        .put(`/catalog/sections/${sectionId}`, { ...payload, storeId })
        .then((r) => r.data.data ?? r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["catalog", "sections", storeId] }),
  });
};

export const useDeleteSection = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sectionId: string) =>
      api
        .delete(`/catalog/sections/${sectionId}`, { data: { storeId } })
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["catalog", "sections", storeId] }),
  });
};

export const useReorderSections = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      api
        .patch(`/catalog/${storeId}/sections/reorder`, { orderedIds })
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["catalog", "sections", storeId] }),
  });
};

// ═══════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════

type ProductsResponse = PaginatedListResponse<Product, "products">;

const fetchProducts = async (
  storeId: string,
  params?: {
    sectionId?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
): Promise<ProductsResponse> => {
  const { data } = await api.get(`/catalog/${storeId}/products`, {
    params: { ...params, includeHidden: true },
  });
  return data.data ?? data;
};

export const useProducts = (
  storeId: string,
  params?: {
    sectionId?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
) =>
  useQuery({
    queryKey: ["catalog", "products", storeId, params],
    queryFn: () => fetchProducts(storeId, params),
    enabled: !!storeId,
    placeholderData: keepPreviousData,
  });

const fetchProductById = async (
  storeId: string,
  productId: string,
): Promise<Product> => {
  const { data } = await api.get(`/catalog/${storeId}/products/${productId}`);
  return data.data ?? data;
};

export const useProduct = (storeId: string, productId: string) =>
  useQuery({
    queryKey: ["catalog", "product", storeId, productId],
    queryFn: () => fetchProductById(storeId, productId),
    enabled: !!storeId && !!productId,
  });

export const useCreateProduct = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) =>
      api
        .post(`/catalog/${storeId}/products`, payload)
        .then((r) => r.data.data ?? r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog", "products", storeId] });
      qc.invalidateQueries({ queryKey: ["catalog", "sections", storeId] });
    },
  });
};

export const useUpdateProduct = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      ...payload
    }: UpdateProductPayload & { productId: string }) =>
      api
        .put(`/catalog/products/${productId}`, { ...payload, storeId })
        .then((r) => r.data.data ?? r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog", "products", storeId] });
      qc.invalidateQueries({ queryKey: ["catalog", "sections", storeId] });
    },
  });
};

export const useDeleteProduct = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      api
        .delete(`/catalog/products/${productId}`, { data: { storeId } })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog", "products", storeId] });
      qc.invalidateQueries({ queryKey: ["catalog", "sections", storeId] });
    },
  });
};

// ═══════════════════════════════════════════════════════════════
// OPTION GROUPS
// ═══════════════════════════════════════════════════════════════

const fetchOptionGroups = async (
  storeId: string,
  productId: string,
): Promise<OptionGroup[]> => {
  const { data } = await api.get(
    `/catalog/products/${productId}/option-groups`,
    { params: { storeId } },
  );
  return data.data ?? data;
};

export const useOptionGroups = (storeId: string, productId: string) =>
  useQuery({
    queryKey: ["catalog", "option-groups", storeId, productId],
    queryFn: () => fetchOptionGroups(storeId, productId),
    enabled: !!storeId && !!productId,
  });

export const useCreateOptionGroup = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      ...payload
    }: CreateOptionGroupPayload & { productId: string }) =>
      api
        .post(`/catalog/products/${productId}/option-groups`, {
          ...payload,
          storeId,
        })
        .then((r) => r.data.data ?? r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["catalog", "option-groups", storeId, vars.productId],
      });
      qc.invalidateQueries({
        queryKey: ["catalog", "product", storeId, vars.productId],
      });
    },
  });
};

export const useUpdateOptionGroup = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      ...payload
    }: UpdateOptionGroupPayload & { groupId: string }) =>
      api
        .put(`/catalog/option-groups/${groupId}`, { ...payload, storeId })
        .then((r) => r.data.data ?? r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog", "option-groups", storeId] });
      qc.invalidateQueries({ queryKey: ["catalog", "product"] });
    },
  });
};

export const useDeleteOptionGroup = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) =>
      api
        .delete(`/catalog/option-groups/${groupId}`, { data: { storeId } })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog", "option-groups", storeId] });
    },
  });
};

// ═══════════════════════════════════════════════════════════════
// OPTION VALUES
// ═══════════════════════════════════════════════════════════════

export const useCreateOptionValue = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      ...payload
    }: CreateOptionValuePayload & { groupId: string }) =>
      api
        .post(`/catalog/option-groups/${groupId}/values`, {
          ...payload,
          storeId,
        })
        .then((r) => r.data.data ?? r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog", "option-groups", storeId] });
    },
  });
};

export const useUpdateOptionValue = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      valueId,
      ...payload
    }: UpdateOptionValuePayload & { valueId: string }) =>
      api
        .put(`/catalog/option-values/${valueId}`, { ...payload, storeId })
        .then((r) => r.data.data ?? r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog", "option-groups", storeId] });
    },
  });
};

export const useDeleteOptionValue = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (valueId: string) =>
      api
        .delete(`/catalog/option-values/${valueId}`, { data: { storeId } })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog", "option-groups", storeId] });
    },
  });
};

// ═══════════════════════════════════════════════════════════════
// BULK
// ═══════════════════════════════════════════════════════════════

export const useBulkAddSections = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      sections: {
        name: string;
        sortOrder?: number;
        products?: CreateProductPayload[];
      }[],
    ) =>
      api
        .post(`/catalog/${storeId}/bulk`, { sections })
        .then((r) => r.data.data ?? r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog", "sections", storeId] });
      qc.invalidateQueries({ queryKey: ["catalog", "products", storeId] });
    },
  });
};
