import { useQuery } from '@tanstack/react-query';
import api from '@config/axios';
import type { ApiResponse } from '@src/types/api.types';

// The API exposes earnings not a dedicated "stats" route.
// We compute stats from the driver profile + earnings.
export interface DriverStats {
  todayDeliveries: number;
  todayEarnings: number;
  weekDeliveries: number;
  weekEarnings: number;
  rating: number;
  totalDeliveries: number;
}

export const HOME_KEYS = {
  stats: ['home', 'stats'] as const,
  profile: ['home', 'profile'] as const,
};

// Fetch driver profile (includes _count for total deliveries)
export const useDriverProfile = () => {
  return useQuery({
    queryKey: HOME_KEYS.profile,
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>('/drivers/profile');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

// Compute stats from earnings API
export const useDriverStats = () => {
  return useQuery({
    queryKey: HOME_KEYS.stats,
    queryFn: async (): Promise<DriverStats> => {
      const [profileRes, earningsRes] = await Promise.all([
        api.get<ApiResponse<any>>('/drivers/profile'),
        api.get<ApiResponse<any>>('/drivers/earnings?limit=100'),
      ]);

      console.log("[Profile API res]:", JSON.stringify(profileRes.data, null, 2)); const profile = profileRes.data.data;
      const earningsData = earningsRes.data.data;
      const earnings: any[] = earningsData?.earnings ?? [];

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);

      const todayEarnings = earnings.filter(
        (e) => new Date(e.createdAt) >= todayStart
      );
      const weekEarnings = earnings.filter(
        (e) => new Date(e.createdAt) >= weekStart
      );

      return {
        todayDeliveries: todayEarnings.length,
        todayEarnings: todayEarnings.reduce(
          (sum, e) => sum + Number(e.totalAmount ?? 0),
          0
        ),
        weekDeliveries: weekEarnings.length,
        weekEarnings: weekEarnings.reduce(
          (sum, e) => sum + Number(e.totalAmount ?? 0),
          0
        ),
        rating: 5.0, // placeholder until rating API is available
        totalDeliveries: profile?._count?.deliveries ?? earnings.length,
      };
    },
    staleTime: 1000 * 60 * 2,
  });
};
