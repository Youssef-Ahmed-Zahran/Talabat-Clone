import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMyOrders, useReorder } from "../api/order.api";
import { useCartStore } from "@src/store/cartStore";
import api from "@src/config/axios";
import type { Order } from "@src/features/orders/types/order.types";
import { UseOrderHistoryReturn } from "../types/order.types";

// ─── Return type ──────────────────────────────────────────────// ─── Hook ─────────────────────────────────────────────────────
export function useOrderHistory(): UseOrderHistoryReturn {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: orders, isLoading, refetch } = useMyOrders();
  const { mutate: reorder } = useReorder();

  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Review state
  const [selectedReviewOrder, setSelectedReviewOrder] = useState<Order | null>(
    null,
  );

  // ── Refetch on screen focus ───────────────────────────────
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // ── Pull-to-refresh ───────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // ── Track live order ──────────────────────────────────────
  const handleTrack = useCallback(
    (orderId: string) => {
      router.push({
        pathname: "/tracking/live",
        params: { orderId },
      });
    },
    [router],
  );

  // ── Navigate to home (empty state CTA) ───────────────────
  const navigateHome = useCallback(() => {
    router.replace("/");
  }, [router]);

  // ── Reorder ───────────────────────────────────────────────
  const handleReorder = useCallback(
    (orderId: string, storeId: string) => {
      setReorderingId(orderId);
      reorder(orderId, {
        onSuccess: async () => {
          try {
            // Pre-load the newly-built cart into Zustand so Cart screen shows items instantly
            const res = await api.get(`/carts/${storeId}`);
            const cart = res.data?.data;
            if (cart) {
              useCartStore
                .getState()
                .setCart(cart.id, cart.storeId, cart.items || []);
            }
          } catch (e) {
            console.warn("[Reorder] Could not pre-load cart:", e);
          }
          setReorderingId(null);
          qc.invalidateQueries({ queryKey: ["cart"] });
          router.push("/(tabs)/cart");
        },
        onError: (err: any) => {
          setReorderingId(null);
          const msg =
            err?.response?.data?.message ||
            "Could not add items to cart. Please try again.";
          console.error("[Reorder error]", err?.response?.data);
          Alert.alert("Reorder failed", msg);
        },
      });
    },
    [reorder, qc, router],
  );

  // ── Review ──────────────────────────────────────────────────
  const handleReview = useCallback((order: Order) => {
    setSelectedReviewOrder(order);
  }, []);

  const closeReviewModal = useCallback(() => {
    setSelectedReviewOrder(null);
  }, []);

  return {
    query: {
      orders,
      isLoading,
    },
    state: {
      refreshing,
      reorderingId,
      selectedReviewOrder,
    },
    actions: {
      onRefresh,
      handleReorder,
      handleTrack,
      handleReview,
      closeReviewModal,
    },
    router: {
      navigateHome,
    },
  };
}
