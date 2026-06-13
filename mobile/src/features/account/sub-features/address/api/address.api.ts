import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@src/config/axios';
import type { UserAddress, CreateAddressRequest } from '@src/features/location/types/address.types';
import type { ApiResponse } from '@src/types/api.types';

// ─── Get My Addresses ─────────────────────────────────────────
export const useMyAddresses = () => {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<UserAddress[]>>('/addresses');
      return res.data.data;
    },
  });
};

// ─── Create Address ───────────────────────────────────────────
export const useCreateAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAddressRequest) => {
      const res = await api.post<ApiResponse<UserAddress>>('/addresses', data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

// ─── Update Address ───────────────────────────────────────────
export const useUpdateAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CreateAddressRequest> & { id: string }) => {
      const res = await api.put<ApiResponse<UserAddress>>(`/addresses/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

// ─── Delete Address ───────────────────────────────────────────
export const useDeleteAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/addresses/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

// ─── Set Default Address ──────────────────────────────────────
export const useSetDefaultAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch<ApiResponse<UserAddress>>(`/addresses/${id}/default`);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};
