import { useQuery } from "@tanstack/react-query";
import api from "@src/config/axios";
import type { TrackingData } from "@src/features/tracking/types/tracking.types";
import type { ApiResponse } from "@src/types/api.types";

// ─── Get Order Tracking ──────────────────────────────────────
export const useOrderTracking = (orderId: string) => {
  return useQuery({
    queryKey: ["tracking", orderId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<TrackingData>>(
        `/tracking/${orderId}`,
      );
      return res.data.data;
    },
    enabled: !!orderId,
    refetchInterval: 5000, // Poll every 5s for real-time tracking
  });
};
