import { useQuery } from '@tanstack/react-query';
import api from '../../../config/axios';
import type { DashboardStats } from '../../../types';

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await api.get('/admin/dashboard');
  return data.data ?? data;
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 60000, // Refresh every minute automatically
  });
};
