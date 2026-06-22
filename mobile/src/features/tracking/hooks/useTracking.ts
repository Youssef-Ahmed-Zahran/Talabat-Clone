import { useState, useEffect, useCallback } from "react";
import { Alert, Linking } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useOrderTracking } from "../api/tracking.api";
import { useOrderById } from "@src/features/orders/api/order.api";
import { trackingSocket, connectSocket } from "@src/config/socket";
import { useUIStore } from "@src/store/uiStore";
import { UseTrackingReturn } from "../types/tracking.types";

const STATUS_STEPS = [
  "WAITING_FOR_DRIVER",
  "DRIVER_ASSIGNED",
  "DRIVER_HEADING_TO_STORE",
  "DRIVER_AT_STORE",
  "DRIVER_HEADING_TO_CUSTOMER",
  "DELIVERED",
];

const STATUS_LABELS: Record<string, string> = {
  WAITING_FOR_DRIVER: "Finding your driver...",
  DRIVER_ASSIGNED: "Driver assigned!",
  DRIVER_HEADING_TO_STORE: "Heading to the store",
  DRIVER_AT_STORE: "Picking up your order",
  DRIVER_HEADING_TO_CUSTOMER: "On the way to you!",
  DELIVERED: "Order Delivered",
};
export function useTracking(): UseTrackingReturn {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { data: tracking, isLoading: trackLoading } = useOrderTracking(
    orderId || "",
  );
  const { data: order } = useOrderById(orderId || "");
  const setActiveOrder = useUIStore((s) => s.setActiveOrder);

  const [driverLat, setDriverLat] = useState<number | null>(null);
  const [driverLng, setDriverLng] = useState<number | null>(null);

  useEffect(() => {
    if (!orderId) return;

    connectSocket(trackingSocket).then(() => {
      trackingSocket.emit("tracking:join", { orderId });
    });

    trackingSocket.on("tracking:snapshot", (data: any) => {
      if (data?.liveTracking) {
        if (data.liveTracking.driverLatitude) {
          setDriverLat(Number(data.liveTracking.driverLatitude));
        }
        if (data.liveTracking.driverLongitude) {
          setDriverLng(Number(data.liveTracking.driverLongitude));
        }
      }
    });

    trackingSocket.on("tracking:location", (data: any) => {
      if (data?.latitude && data?.longitude) {
        setDriverLat(Number(data.latitude));
        setDriverLng(Number(data.longitude));
      }
    });

    trackingSocket.on("tracking:status_changed", (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["tracking", orderId] });
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    });

    return () => {
      trackingSocket.off("tracking:snapshot");
      trackingSocket.off("tracking:location");
      trackingSocket.off("tracking:status_changed");
      trackingSocket.disconnect();
    };
  }, [orderId, queryClient]);

  const currentStatus =
    tracking?.status || order?.liveTracking?.status || "WAITING_FOR_DRIVER";
  const currentStep = STATUS_STEPS.indexOf(currentStatus);
  const lat = driverLat ?? tracking?.driverLatitude ?? null;
  const lng = driverLng ?? tracking?.driverLongitude ?? null;
  const storeLat = tracking?.storeLatitude ?? tracking?.order?.store?.latitude;
  const storeLng =
    tracking?.storeLongitude ?? tracking?.order?.store?.longitude;
  const destLat =
    tracking?.deliveryLatitude ?? tracking?.order?.address?.latitude;
  const destLng =
    tracking?.deliveryLongitude ?? tracking?.order?.address?.longitude;

  const isFinished =
    currentStatus === "DELIVERED" ||
    currentStatus === "CANCELLED" ||
    order?.status === "DELIVERED" ||
    order?.status === "CANCELLED";

  // ── Auto-navigate when order completes ───────────────────────
  // This runs AFTER render (in useEffect), safely outside the render cycle,
  // so navigation never races with an in-progress re-render caused by sockets.
  useEffect(() => {
    if (!isFinished) return;

    // Tear down socket first to prevent any further state updates
    trackingSocket.off("tracking:snapshot");
    trackingSocket.off("tracking:location");
    trackingSocket.off("tracking:status_changed");
    trackingSocket.disconnect();

    // Brief delay so the user sees the "Delivered" status before leaving
    const timer = setTimeout(() => {
      setActiveOrder(null);
      router.replace("/");
    }, 2000);

    return () => clearTimeout(timer);
  }, [isFinished, setActiveOrder, router]);

  const handleCallDriver = useCallback(async () => {
    const phone = tracking?.driver?.phone;
    if (!phone) return;
    const url = `tel:${phone}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert(
        "Call Driver",
        `Phone: ${phone}\n\nYour device can't make calls directly. Please dial manually.`,
      );
    }
  }, [tracking?.driver?.phone]);

  const navigateBack = useCallback(() => router.back(), [router]);

  const navigateToChat = useCallback(() => {
    router.push({ pathname: "/tracking/chat", params: { orderId } });
  }, [router, orderId]);

  // Manual fallback — user can tap if auto-nav is slow
  const handleFinishTracking = useCallback(() => {
    trackingSocket.off("tracking:snapshot");
    trackingSocket.off("tracking:location");
    trackingSocket.off("tracking:status_changed");
    trackingSocket.disconnect();
    setActiveOrder(null);
    router.replace("/");
  }, [setActiveOrder, router]);

  return {
    query: {
      orderId: orderId || "",
      order,
      tracking,
      trackLoading,
      currentStatus,
      currentStep,
      isFinished,
      STATUS_STEPS,
      STATUS_LABELS,
    },
    coords: {
      lat,
      lng,
      driverLat,
      driverLng,
      storeLat,
      storeLng,
      destLat,
      destLng,
    },
    actions: {
      handleCallDriver,
      handleFinishTracking,
    },
    router: {
      navigateBack,
      navigateToChat,
    },
  };
}
