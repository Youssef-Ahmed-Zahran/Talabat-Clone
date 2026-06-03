import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../config/axios';
import type { User, PaginatedListResponse } from '../../../types';

type UsersResponse = PaginatedListResponse<User, 'users'>;

// ── Fetch all users (admin endpoint) ───────────────────────────────────
const fetchUsers = async (search?: string, page?: number, limit?: number): Promise<UsersResponse> => {
  const { data } = await api.get('/admin/users', {
    params: { search, page, limit }
  });
  return data.data ?? data;
};

export const useUsers = (search?: string, page?: number, limit?: number) => {
  return useQuery({
    queryKey: ['users', search, page, limit],
    queryFn: () => fetchUsers(search, page, limit),
  });
};

// ── Block user ─────────────────────────────────────────────────────────
const blockUser = async (userId: string) => {
  const { data } = await api.patch(`/admin/users/${userId}/block`);
  return data.data ?? data;
};

export const useBlockUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: blockUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// ── Unblock user ───────────────────────────────────────────────────────
const unblockUser = async (userId: string) => {
  const { data } = await api.patch(`/admin/users/${userId}/unblock`);
  return data.data ?? data;
};

export const useUnblockUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unblockUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// ── Fetch user by ID ───────────────────────────────────────────────────
const fetchUserById = async (userId: string): Promise<User> => {
  const { data } = await api.get(`/admin/users/${userId}`);
  return data.data ?? data;
};

export const useUser = (userId: string) => {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUserById(userId),
    enabled: !!userId,
  });
};

// ── Fetch user orders ──────────────────────────────────────────────────
const fetchUserOrders = async (userId: string) => {
  const { data } = await api.get(`/admin/users/${userId}/orders`);
  return data.data ?? data;
};

export const useUserOrders = (userId: string) => {
  return useQuery({
    queryKey: ['users', userId, 'orders'],
    queryFn: () => fetchUserOrders(userId),
    enabled: !!userId,
  });
};
