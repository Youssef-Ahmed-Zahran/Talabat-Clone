import { useRouter, useLocalSearchParams } from "expo-router";
import { useOrderById } from "../api/order.api";
import { UseOrderDetailReturn } from "../types/order.types";

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
