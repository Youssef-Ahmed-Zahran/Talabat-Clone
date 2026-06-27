import { useDashboardStats } from "../api/dashboard.api";

export function useDashboard() {
  const { data: stats, isLoading, isError, refetch } = useDashboardStats();

  return {
    query: {
      stats,
      isLoading,
      isError,
      refetch,
    },
    state: {
      isAdmin: false, // Partner Portal — always owner, never admin
    },
  };
}
