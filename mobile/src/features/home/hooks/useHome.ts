import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { useMainCategories } from "../api/mainCategory.api";
import { useNearbyStores } from "@src/features/stores/api/store.api";
import { useLocationStore } from "@src/store/locationStore";
import { useUIStore } from "@src/store/uiStore";
import { useOrderTracking } from "@src/features/tracking/api/tracking.api";
import { useOrderById } from "@src/features/orders/api/order.api";
import type {
  MainCategory,
  Store,
} from "@src/features/stores/types/store.types";
import { UseHomeReturn } from "../types/home.types";

const STATUS_STEPS = [
  "WAITING_FOR_DRIVER",
  "DRIVER_ASSIGNED",
  "DRIVER_HEADING_TO_STORE",
  "DRIVER_AT_STORE",
  "DRIVER_HEADING_TO_CUSTOMER",
  "DELIVERED",
];
export function useHome(): UseHomeReturn {
  const router = useRouter();
  const { defaultAddress, selectedLatitude, selectedLongitude } =
    useLocationStore();
  const { activeOrderId, activeOrderStatus } = useUIStore();

  const [refreshing, setRefreshing] = useState(false);

  const { data: order, refetch: refetchOrder } = useOrderById(
    activeOrderId || "",
  );
  const { data: tracking, refetch: refetchTracking } = useOrderTracking(
    activeOrderId || "",
  );
  const {
    data: categories,
    isLoading: catLoading,
    refetch: refetchCategories,
  } = useMainCategories();
  const {
    data: nearbyData,
    isLoading: storesLoading,
    refetch: refetchStores,
  } = useNearbyStores(selectedLatitude, selectedLongitude);

  const stores = nearbyData?.stores ?? [];

  const currentStatus =
    tracking?.status ||
    order?.liveTracking?.status ||
    order?.status ||
    activeOrderStatus ||
    "WAITING_FOR_DRIVER";
  const currentStep = STATUS_STEPS.indexOf(currentStatus);
  const isFinished =
    currentStatus === "DELIVERED" ||
    currentStatus === "CANCELLED" ||
    order?.status === "DELIVERED" ||
    order?.status === "CANCELLED";

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchCategories(),
        refetchStores(),
        activeOrderId ? refetchOrder() : Promise.resolve(),
        activeOrderId ? refetchTracking() : Promise.resolve(),
      ]);
    } catch (error) {
      console.error("[useHome] Error refreshing home data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [
    refetchCategories,
    refetchStores,
    refetchOrder,
    refetchTracking,
    activeOrderId,
  ]);

  const navigateToCategory = useCallback(
    (categoryId: string, categoryName: string) => {
      router.push({
        pathname: "/stores/list",
        params: { categoryId, categoryName },
      });
    },
    [router],
  );

  const navigateToStore = useCallback(
    (storeId: string) => {
      router.push({ pathname: "/stores/detail", params: { storeId } });
    },
    [router],
  );

  const navigateToTracking = useCallback(
    (orderId: string) => {
      if (order?.deliveryType === "STORE_DELIVERY") {
        // Store-managed delivery — no live GPS, go to order detail
        router.push({ pathname: "/orders/detail", params: { orderId } });
      } else {
        router.push({ pathname: "/tracking/live", params: { orderId } });
      }
    },
    [router, order],
  );

  const navigateToLocation = useCallback(() => {
    router.push("/location/country-select");
  }, [router]);

  const navigateToAllStores = useCallback(() => {
    router.push("/stores/list");
  }, [router]);

  return {
    query: {
      categories,
      stores,
      catLoading,
      storesLoading,
    },
    state: {
      defaultAddress,
      refreshing,
      onRefresh,
    },
    tracking: {
      activeOrderId,
      currentStatus,
      currentStep,
      isFinished,
      STATUS_STEPS,
      deliveryType: order?.deliveryType,
    },
    router: {
      navigateToCategory,
      navigateToStore,
      navigateToTracking,
      navigateToLocation,
      navigateToAllStores,
    },
  };
}
