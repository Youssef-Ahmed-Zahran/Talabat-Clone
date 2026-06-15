import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import api from "@config/axios";
import { useAuthStore } from "@store/authStore";
import { useUIStore } from "@store/uiStore";
import { useLogoutApi } from "@features/auth/api/auth.api";
import { COLORS } from "@constants/theme";
import type { ApiResponse } from "@src/types/api.types";

const APP_STATUS_COLOR: Record<string, string> = {
  APPROVED: COLORS.success,
  PENDING: COLORS.warning,
  REJECTED: COLORS.danger,
};

export default function ProfileScreen() {
  const driver = useAuthStore((s) => s.driver);
  const isOnline = useUIStore((s) => s.isOnline);
  const { mutateAsync: logoutApi, isPending: isLoggingOut } = useLogoutApi();

  // Fetch profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", "detail"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>("/drivers/profile");
      return res.data.data;
    },
  });

  // Fetch wallet
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["profile", "wallet"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>("/drivers/wallet");
      return res.data.data.wallet;
    },
  });

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logoutApi();
          } catch {
            const { logout } = useAuthStore.getState();
            await logout();
          }
        },
      },
    ]);
  };

  const appStatus = profile?.application?.status ?? "PENDING";
  const driverName =
    profile?.application?.firstName && profile?.application?.familyName
      ? `${profile.application.firstName} ${profile.application.familyName}`
      : (driver?.fullName ?? "Driver");

  return (
    <SafeAreaView className="flex-1 bg-surfaceAlt" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero header */}
        <View className="bg-surface px-5 pt-6 pb-6 items-center border-b border-border">
          <View className="w-20 h-20 rounded-full bg-primarySoft items-center justify-center mb-3">
            <Ionicons name="person" size={36} color={COLORS.primary} />
          </View>
          <Text className="text-xl font-bold text-textPrimary">
            {driverName}
          </Text>
          <Text className="text-sm text-textSecondary mt-0.5">
            {driver?.email}
          </Text>

          {/* App status */}
          <View
            className="mt-2 px-3 py-1 rounded-full"
            style={{ backgroundColor: `${APP_STATUS_COLOR[appStatus]}20` }}
          >
            <Text
              className="text-xs font-semibold capitalize"
              style={{ color: APP_STATUS_COLOR[appStatus] }}
            >
              {appStatus === "APPROVED"
                ? "✓ Approved Driver"
                : `Application: ${appStatus}`}
            </Text>
          </View>

          {/* Online indicator */}
          <View
            className={`flex-row items-center gap-2 mt-2 px-4 py-1.5 rounded-full ${
              isOnline
                ? "bg-successLight"
                : "bg-surfaceAlt border border-border"
            }`}
          >
            <View
              className={`w-2 h-2 rounded-full ${isOnline ? "bg-success" : "bg-textTertiary"}`}
            />
            <Text
              className="text-xs font-medium"
              style={{ color: isOnline ? COLORS.success : COLORS.textTertiary }}
            >
              {isOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        {/* Wallet */}
        {walletLoading ? (
          <View className="mx-4 mt-4 h-20 items-center justify-center">
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : wallet ? (
          <View className="mx-4 mt-4 bg-primary rounded-2xl p-5 flex-row items-center justify-between">
            <View>
              <Text className="text-white/70 text-xs font-semibold uppercase">
                Wallet Balance
              </Text>
              <Text className="text-white text-3xl font-bold mt-1">
                {Number(wallet.balance).toFixed(2)} EGP
              </Text>
              {Number(wallet.balance) < 0 && (
                <Text className="text-white/80 text-xs mt-1">
                  ⚠️ Cash to settle
                </Text>
              )}
            </View>
            <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
              <Ionicons name="wallet-outline" size={24} color={COLORS.white} />
            </View>
          </View>
        ) : null}

        {/* Account info */}
        {profileLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <View className="mx-4 mt-4 bg-surface rounded-2xl border border-border overflow-hidden">
            <Text className="px-4 pt-4 pb-2 text-xs font-semibold text-textTertiary uppercase">
              Account Details
            </Text>
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={driver?.email ?? "—"}
            />
            <InfoRow
              icon="call-outline"
              label="Phone"
              value={profile?.phone ?? "—"}
            />
            <InfoRow
              icon="bicycle-outline"
              label="Vehicle"
              value={profile?.application?.vehicleType ?? "—"}
            />
            <InfoRow
              icon="location-outline"
              label="City"
              value={profile?.city?.name ?? "—"}
            />
            <InfoRow
              icon="cube-outline"
              label="Total Deliveries"
              value={String(profile?._count?.deliveries ?? 0)}
              last
            />
          </View>
        )}

        {/* Sign out */}
        <View className="mx-4 mt-4 mb-10">
          <TouchableOpacity
            className="bg-dangerLight border border-danger rounded-2xl h-14 flex-row items-center justify-center gap-2"
            onPress={handleLogout}
            disabled={isLoggingOut}
            activeOpacity={0.8}
          >
            {isLoggingOut ? (
              <ActivityIndicator color={COLORS.danger} />
            ) : (
              <>
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color={COLORS.danger}
                />
                <Text className="text-danger font-semibold text-base">
                  Sign Out
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  last?: boolean;
}

function InfoRow({ icon, label, value, last }: InfoRowProps) {
  return (
    <View
      className={`flex-row items-center px-4 py-3.5 gap-3 ${!last ? "border-b border-border" : ""}`}
    >
      <View className="w-8 h-8 rounded-full bg-surfaceAlt items-center justify-center">
        <Ionicons name={icon as any} size={16} color={COLORS.textSecondary} />
      </View>
      <Text className="flex-1 text-sm text-textSecondary">{label}</Text>
      <Text
        className="text-sm font-semibold text-textPrimary max-w-xs"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
