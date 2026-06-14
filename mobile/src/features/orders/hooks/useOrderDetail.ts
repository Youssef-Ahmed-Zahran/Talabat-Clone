import { useRouter, useLocalSearchParams } from "expo-router";
import { useOrderById } from "../api/order.api";

// ─── Return type ──────────────────────────────────────────────
export interface UseOrderDetailReturn {
  query: {
    order: ReturnType<typeof useOrderById>["data"];
    isLoading: boolean;
  };
  router: {
    goBack: () => void;
  };
}

// ─── Hook ─────────────────────────────────────────────────────
export function useOrderDetail(): UseOrderDetailReturn {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const { data: order, isLoading } = useOrderById(orderId || "");

  const goBack = () => router.back();

  return {
    query: { order, isLoading },
    router: { goBack },
  };
}
