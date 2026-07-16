import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import {
  useActiveDelivery,
  useUpdateDeliveryStatus,
  DeliveryStatus,
  DELIVERY_KEYS,
} from "@features/deliveries/api/deliveries.api";
import { trackingSocket, connectSocket } from "@config/socket";
import { COLORS } from "@constants/theme";
import { getErrorMessage } from "@utils/error";
import { ChatSheet } from "../components/ChatSheet";
import { useUIStore } from "@store/uiStore";
import { useQueryClient } from "@tanstack/react-query";
import { HOME_KEYS } from "@features/home/api/home.api";
import { NEXT_STATUS, STATUS_LABEL } from "../components/constants";

export default function DeliveryDetailScreen() {
  const router = useRouter();
  const setChatSheetOpen = useUIStore((s) => s.setChatSheetOpen);
  const setChatOrderId = useUIStore((s) => s.setChatOrderId);

  const { data: activeDelivery, isLoading, refetch } = useActiveDelivery();
  const { mutateAsync: updateStatus, isPending: isUpdating } =
    useUpdateDeliveryStatus();

  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [trackingConnected, setTrackingConnected] = useState(false);
  const mapRef = useRef<MapView>(null);
  const locationWatcher = useRef<Location.LocationSubscription | null>(null);
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // The current order from active delivery (may differ from URL id)
  const order = activeDelivery?.order;
  const storeCoords = order
    ? {
        latitude: Number(order.store.latitude),
        longitude: Number(order.store.longitude),
      }
    : null;
  const customerCoords = order
    ? {
        latitude: Number(order.address.latitude),
        longitude: Number(order.address.longitude),
      }
    : null;

  // ── Connect to tracking socket ────────────────────────────────
  useEffect(() => {
    if (!order) return;

    connectSocket(trackingSocket).then(() => {
      setTrackingConnected(true);
      trackingSocket.emit(
        "tracking:join",
        { orderId: order.id },
        (_ack: any) => {},
      );
    });

    return () => {
      if (order) trackingSocket.emit("tracking:leave", { orderId: order.id });
    };
  }, [order?.id]);

  // ── Request location & start pinging ─────────────────────────
  useEffect(() => {
    if (!order || !trackingConnected) return;

    const locationCallback = (loc: Location.LocationObject) => {
      const { latitude, longitude } = loc.coords;
      setDriverLocation({ latitude, longitude });
      mapRef.current?.animateCamera(
        { center: { latitude, longitude }, zoom: 15 },
        { duration: 500 },
      );
      trackingSocket.emit("tracking:driver_ping", {
        orderId: order.id,
        latitude,
        longitude,
      });
    };

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required for delivery tracking.",
        );
        return;
      }

      // Try High accuracy first; fall back to Balanced if device settings block GPS
      try {
        locationWatcher.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 10 },
          locationCallback,
        );
      } catch {
        try {
          // Balanced accuracy works with network location even when GPS is off
          locationWatcher.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Balanced, distanceInterval: 20 },
            locationCallback,
          );
        } catch (fallbackErr) {
          console.warn(
            "[Location] Could not start location tracking:",
            fallbackErr,
          );
        }
      }

      // Ping server every 15s via socket
      pingInterval.current = setInterval(async () => {
        try {
          const loc = await Location.getLastKnownPositionAsync();
          if (!loc) return;
          trackingSocket.emit("tracking:driver_ping", {
            orderId: order.id,
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        } catch (err) {
          console.warn("[Location] ping interval failed:", err);
        }
      }, 15_000);
    })();

    return () => {
      locationWatcher.current?.remove();
      if (pingInterval.current) clearInterval(pingInterval.current);
    };
  }, [order?.id, trackingConnected]);

  const qc = useQueryClient();

  const handleStatusUpdate = useCallback(
    async (status: DeliveryStatus) => {
      if (!order) return;
      try {
        // Use socket for real-time update
        trackingSocket.emit(
          "tracking:status_update",
          { orderId: order.id, status },
          (_ack: any) => {},
        );
        // REST call
        await updateStatus({ orderId: order.id, status });

        if (status === "DELIVERED") {
          // Stop location tracking immediately
          locationWatcher.current?.remove();
          if (pingInterval.current) clearInterval(pingInterval.current);

          // Wipe the active delivery from the cache so the screen unmounts cleanly
          qc.setQueryData(DELIVERY_KEYS.active(), null);

          // Refresh earnings/stats in the background
          qc.invalidateQueries({ queryKey: HOME_KEYS.stats });
          qc.invalidateQueries({ queryKey: HOME_KEYS.profile });

          // Navigate home immediately — don't wait for the Alert tap
          router.replace("/(tabs)");

          // Show success toast after navigation
          Alert.alert(
            "🎉 Delivered!",
            "Great job! Order delivered successfully.",
          );
        } else {
          // For intermediate steps just refetch the active delivery
          await refetch();
        }
      } catch (err) {
        Alert.alert("Error", getErrorMessage(err));
      }
    },
    [order?.id, updateStatus, refetch, router, qc],
  );

  const openChat = () => {
    if (!order) return;
    setChatOrderId(order.id);
    setChatSheetOpen(true);
  };

  const callCustomer = () => {
    if (!order?.user.phone) return;
    Linking.openURL(`tel:${order.user.phone}`);
  };

  const openInMaps = (lat: number, lng: number) => {
    const url = `https://maps.google.com/?q=${lat},${lng}`;
    Linking.openURL(url);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center px-6">
        <Ionicons name="cube-outline" size={56} color={COLORS.textTertiary} />
        <Text className="text-textPrimary font-bold text-xl mt-4">
          No Active Delivery
        </Text>
        <Text className="text-textSecondary text-center mt-2">
          You don&apos;t have an active delivery right now.
        </Text>
        <TouchableOpacity
          className="mt-6 bg-primary px-8 py-3 rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentStatus = order.status;
  const nextStep = NEXT_STATUS[currentStatus];
  const liveTrackingStatus = order.liveTracking?.status;

  // Determine which marker to focus — heading to store or heading to customer
  const focusCoords = ["DRIVER_HEADING_TO_STORE", "DRIVER_AT_STORE"].includes(
    liveTrackingStatus ?? "",
  )
    ? storeCoords
    : customerCoords;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-border">
        <TouchableOpacity
          className="w-9 h-9 items-center justify-center rounded-full bg-surfaceAlt mr-3"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-textPrimary">
            Order #{order.id.slice(-6).toUpperCase()}
          </Text>
          <Text className="text-xs text-textSecondary">
            {STATUS_LABEL[currentStatus] ?? currentStatus}
          </Text>
        </View>
        {/* Chat button */}
        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-primarySoft items-center justify-center mr-2"
          onPress={openChat}
        >
          <Ionicons
            name="chatbubble-outline"
            size={18}
            color={COLORS.primary}
          />
        </TouchableOpacity>
        {/* Call button */}
        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-successLight items-center justify-center"
          onPress={callCustomer}
        >
          <Ionicons name="call-outline" size={18} color={COLORS.success} />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View className="h-96">
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={{ flex: 1 }}
          initialRegion={{
            latitude: storeCoords?.latitude ?? 30.0444,
            longitude: storeCoords?.longitude ?? 31.2357,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {/* Store marker */}
          {storeCoords && (
            <Marker
              coordinate={storeCoords}
              title={order.store.name}
              description="Restaurant"
              pinColor={COLORS.primary}
            />
          )}

          {/* Customer marker */}
          {customerCoords && (
            <Marker
              coordinate={customerCoords}
              title={order.user.fullName}
              description="Delivery address"
              pinColor={COLORS.success}
            />
          )}

          {/* Driver's live location */}
          {driverLocation && (
            <Marker
              coordinate={driverLocation}
              title="You"
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View className="w-10 h-10 rounded-full bg-primary border-4 border-white items-center justify-center shadow-lg">
                <Ionicons name="bicycle" size={16} color={COLORS.white} />
              </View>
            </Marker>
          )}

          {/* Route line: driver → store */}
          {driverLocation && storeCoords && (
            <Polyline
              coordinates={[driverLocation, storeCoords]}
              strokeColor={COLORS.primary}
              strokeWidth={3}
              lineDashPattern={[5, 5]}
            />
          )}

          {/* Route line: store → customer */}
          {storeCoords && customerCoords && (
            <Polyline
              coordinates={[storeCoords, customerCoords]}
              strokeColor={COLORS.success}
              strokeWidth={3}
              lineDashPattern={[5, 5]}
            />
          )}
        </MapView>

        {/* Navigate button overlay */}
        <TouchableOpacity
          className="absolute top-3 right-3 bg-white rounded-full px-3 py-2 flex-row items-center gap-1 shadow-md"
          onPress={() =>
            focusCoords &&
            openInMaps(focusCoords.latitude, focusCoords.longitude)
          }
        >
          <Ionicons name="navigate-outline" size={16} color={COLORS.primary} />
          <Text className="text-xs font-semibold text-primary">Navigate</Text>
        </TouchableOpacity>
      </View>

      {/* Order Info */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Customer + Store info */}
        <View className="mx-4 mt-4 bg-surfaceAlt rounded-2xl p-4 border border-border">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-semibold text-textTertiary uppercase">
              Customer
            </Text>
            <Text className="text-sm font-bold text-primary">
              {Number(order.deliveryFees).toFixed(2)} EGP
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-primarySoft items-center justify-center">
              <Ionicons name="person" size={20} color={COLORS.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-textPrimary">
                {order.user.fullName}
              </Text>
              {order.user.phone && (
                <Text className="text-sm text-textSecondary">
                  {order.user.phone}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Route cards */}
        <View className="mx-4 mt-3 bg-surfaceAlt rounded-2xl p-4 border border-border">
          <Text className="text-xs font-semibold text-textTertiary uppercase mb-3">
            Route
          </Text>
          <View className="flex-row items-start gap-3">
            <View className="items-center mt-1 gap-1">
              <View className="w-3 h-3 rounded-full bg-primary" />
              <View className="w-0.5 h-8 bg-border" />
              <View className="w-3 h-3 rounded-full bg-success" />
            </View>
            <View className="flex-1 gap-3">
              <TouchableOpacity
                onPress={() =>
                  storeCoords &&
                  openInMaps(storeCoords.latitude, storeCoords.longitude)
                }
              >
                <Text className="text-xs text-textTertiary">Pick up from</Text>
                <Text className="text-sm font-semibold text-textPrimary mt-0.5">
                  {order.store.name}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  customerCoords &&
                  openInMaps(customerCoords.latitude, customerCoords.longitude)
                }
              >
                <Text className="text-xs text-textTertiary">Deliver to</Text>
                <Text className="text-sm font-semibold text-textPrimary mt-0.5">
                  {order.address.street || "Customer address"}
                </Text>
                {order.address.buildingName && (
                  <Text className="text-xs text-textSecondary">
                    {order.address.buildingName}
                    {order.address.floor
                      ? `, Floor ${order.address.floor}`
                      : ""}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          {order.deliveryInstructions && (
            <View className="mt-3 pt-3 border-t border-border">
              <Text className="text-xs text-textTertiary mb-1">
                Instructions
              </Text>
              <Text className="text-sm text-textSecondary">
                {order.deliveryInstructions}
              </Text>
            </View>
          )}
        </View>

        <View className="h-28" />
      </ScrollView>

      {/* Action Button */}
      {nextStep && (
        <View className="absolute bottom-0 left-0 right-0 bg-surface px-5 pt-4 pb-8 border-t border-border">
          <TouchableOpacity
            className="rounded-2xl h-14 flex-row items-center justify-center gap-2"
            style={{ backgroundColor: nextStep.color }}
            onPress={() => handleStatusUpdate(nextStep.next)}
            disabled={isUpdating}
            activeOpacity={0.85}
          >
            {isUpdating ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons
                  name={nextStep.icon as any}
                  size={22}
                  color={COLORS.white}
                />
                <Text className="text-white font-bold text-base">
                  {nextStep.label}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Chat Sheet */}
      <ChatSheet />
    </SafeAreaView>
  );
}
