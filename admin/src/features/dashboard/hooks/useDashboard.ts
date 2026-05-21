import { useDashboardStats } from "../api/dashboard.api";
import { useAuthStore } from "../../../store/authStore";

export function useDashboard() {
  const { data: stats, isLoading, isError, refetch } = useDashboardStats();
  const role = useAuthStore((s) => s.role);
  const isAdmin = role === "admin";

  return {
    stats,
    isLoading,
    isError,
    refetch,
    role,
    isAdmin,
  };
}
