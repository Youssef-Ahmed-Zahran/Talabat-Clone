import { useQuery } from '@tanstack/react-query';
import api from '../../../config/axios';
import type { DashboardStats } from '../../../types';
import { useAuthStore } from '../../../store/authStore';

const fetchDashboardStats = async (role: string | null): Promise<DashboardStats> => {
  const endpoint = role === 'owner' ? '/owners/dashboard' : '/admin/dashboard';
  const { data } = await api.get(endpoint);
  return data.data ?? data;
};

export const useDashboardStats = () => {
  const role = useAuthStore((s) => s.role);
  
  return useQuery({
    queryKey: ['dashboard-stats', role],
    queryFn: () => fetchDashboardStats(role),
    refetchInterval: 60000, 
  });
};
