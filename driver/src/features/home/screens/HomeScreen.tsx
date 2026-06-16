import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDriverStats, useDriverProfile } from "@features/home/api/home.api";
import { OnlineStatusBanner } from "@features/home/components/OnlineStatusBanner";
import { StatsCard } from "@features/home/components/StatsCard";
import { useActiveDelivery } from "@features/deliveries/api/deliveries.api";
import { IncomingOrderSheet } from "@features/deliveries/components/IncomingOrderSheet";
import { useDispatchListener } from "@features/deliveries/hooks/useDispatchListener";
import { useAuthStore } from "@store/authStore";
import { useUIStore } from "@store/uiStore";
import { COLORS } from "@constants/theme";

export default function HomeScreen() {
  const router = useRouter();
  const driver = useAuthStore((s) => s.driver);
  const isOnline = useUIStore((s) => s.isOnline);
  const setOnline = useUIStore((s) => s.setOnline);

  const { data: profile } = useDriverProfile();

  const {
    data: stats,
    isLoading: statsLoading,
    refetch,
    isRefetching,
  } = useDriverStats();

  const { data: activeDelivery } = useActiveDelivery();

  // Sync online status and driver info with database profile on launch/refresh
  useEffect(() => {
    if (profile) {
      setOnline(profile.isOnline ?? false);

      const authStore = useAuthStore.getState();
      if (authStore.driver) {
        const updatedDriver = {
          ...authStore.driver,
          isOnline: profile.isOnline,
          status: profile.status,
          phone: profile.phone,
          email: profile.email,
        };
        useAuthStore.setState({ driver: updatedDriver });
        AsyncStorage.setItem(
          "driver_user",
          JSON.stringify(updatedDriver),
        ).catch(() => {});
      }
    }
  }, [profile, setOnline]);

  // Mount the dispatch socket listener — listens for dispatch:new_order
  useDispatchListener();

  return (
    <SafeAreaView className="flex-1 bg-surfaceAlt" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Greeting */}
        <View className="px-5 pt-5 pb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-textSecondary">Welcome back 👋</Text>
            <Text className="text-2xl font-bold text-textPrimary mt-0.5">
              {driver?.fullName?.split(" ")[0] ?? "Driver"}
            </Text>
          </View>
          <View className="w-11 h-11 rounded-full bg-primarySoft items-center justify-center">
            <Ionicons name="person" size={22} color={COLORS.primary} />
          </View>
        </View>

        {/* Online/Offline Toggle Banner */}
        <OnlineStatusBanner />

        {/* Active Delivery Banner */}
        {activeDelivery && (
          <TouchableOpacity
            className="mx-4 mt-4 bg-primary rounded-2xl p-4 flex-row items-center gap-3"
            onPress={() => router.push("/deliveries/active")}
            activeOpacity={0.85}
          >
            <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
              <Ionicons name="bicycle" size={22} color={COLORS.white} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-base">
                Active Delivery
              </Text>
              <Text className="text-white/80 text-xs mt-0.5">
                {activeDelivery.order?.store?.name} →{" "}
                {activeDelivery.order?.user?.fullName}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}

        {/* Not online hint */}
        {!isOnline && !activeDelivery && (
          <View className="mx-4 mt-4 bg-surfaceAlt border border-border rounded-2xl p-4 items-center">
            <Ionicons
              name="moon-outline"
              size={32}
              color={COLORS.textTertiary}
            />
            <Text className="text-textSecondary text-sm mt-2 text-center">
              You are offline. Toggle the switch above to start receiving
              orders.
            </Text>
          </View>
        )}

        {/* Stats */}
        {statsLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : stats ? (
          <StatsCard stats={stats} />
        ) : null}

        <View className="h-8" />
      </ScrollView>

      {/* Incoming Order Sheet — rendered above everything */}
      <IncomingOrderSheet />
    </SafeAreaView>
  );
}
