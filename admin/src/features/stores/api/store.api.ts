import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";
import api from "../../../config/axios";
import type {
  Store,
  CreateStorePayload,
  UpdateStorePayload,
  PaginatedListResponse,
  FetchStoresOptions,
} from "../../../types";

type StoresResponse = PaginatedListResponse<Store, "stores">;

const fetchStores = async (
  options: FetchStoresOptions = {},
): Promise<StoresResponse> => {
  const params: Record<string, string | number> = {};
  if (options.mainCategoryId) params.mainCategoryId = options.mainCategoryId;
  if (options.subCategoryId) params.subCategoryId = options.subCategoryId;
  if (options.search) params.search = options.search;
  if (options.page) params.page = options.page;
  if (options.limit) params.limit = options.limit;

  const { data } = await api.get("/stores/admin", { params });
  return data.data ?? data;
};

export const useStores = (options: FetchStoresOptions = {}) => {
  return useQuery({
    queryKey: [
      "stores",
      options.mainCategoryId ?? "all",
      options.subCategoryId ?? "all",
      options.search,
      options.page,
      options.limit,
    ],
    queryFn: () => fetchStores(options),
    placeholderData: keepPreviousData,
  });
};

// ── Create store ───────────────────────────────────────────────────────
const createStore = async (payload: CreateStorePayload): Promise<Store> => {
  const { data } = await api.post("/stores", payload);
  return data.data ?? data;
};

export const useCreateStore = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createStore,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stores"] });
    },
  });
};

// ── Update store ───────────────────────────────────────────────────────
const updateStore = async ({
  storeId,
  payload,
}: {
  storeId: string;
  payload: UpdateStorePayload;
}): Promise<Store> => {
  const { data } = await api.put(`/stores/${storeId}`, payload);
  return data.data ?? data;
};

export const useUpdateStore = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateStore,
    onSuccess: (_, { storeId }) => {
      qc.invalidateQueries({ queryKey: ["stores"] });
      qc.invalidateQueries({ queryKey: ["store", storeId] });
    },
  });
};

// ── Toggle store active status ─────────────────────────────────────────
const toggleStoreStatus = async (storeId: string): Promise<Store> => {
  const { data } = await api.patch(`/stores/${storeId}/toggle`);
  return data.data ?? data;
};

export const useToggleStoreStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleStoreStatus,
    onSuccess: (_, storeId) => {
      qc.invalidateQueries({ queryKey: ["stores"] });
      qc.invalidateQueries({ queryKey: ["store", storeId] });
    },
  });
};

// ── Fetch single store details ─────────────────────────────────────────
const fetchStoreDetails = async (storeId: string): Promise<Store> => {
  const { data } = await api.get(`/stores/${storeId}`);
  return data.data?.store || data.data || data;
};

export const useStoreDetails = (storeId: string | undefined) => {
  return useQuery({
    queryKey: ["store", storeId],
    queryFn: () => fetchStoreDetails(storeId!),
    enabled: !!storeId,
    staleTime: 2 * 60 * 1000, // 2 minutes — serve from cache on revisit
  });
};

// Prefetch a store's details (call on row hover)
export const prefetchStoreDetails = (qc: QueryClient, storeId: string) => {
  qc.prefetchQuery({
    queryKey: ["store", storeId],
    queryFn: () => fetchStoreDetails(storeId),
    staleTime: 2 * 60 * 1000,
  });
};
