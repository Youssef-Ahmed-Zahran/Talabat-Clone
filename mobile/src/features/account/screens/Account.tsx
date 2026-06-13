import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useAccount } from "../hooks/useAccount";
import { AccountMenuItem } from "../components/AccountMenuItem";
import { TalabatLogo } from "@src/components/ui/TalabatLogo";
import { COLORS } from "@src/constants/theme";

const MENU_ITEMS = [
  { id: "profile", icon: "person-outline" as const, label: "My Profile", route: "/account/profile" },
  { id: "addresses", icon: "location-outline" as const, label: "My Addresses", route: "/account/addresses" },
  { id: "wishlist", icon: "heart-outline" as const, label: "Wishlist", route: "/account/wishlist" },
  { id: "help", icon: "headset-outline" as const, label: "Help & Support", route: null },
  { id: "about", icon: "information-circle-outline" as const, label: "About", route: null },
];

export default function AccountScreen() {
  const { query, actions, router } = useAccount();

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]" edges={["top"]}>
      <StatusBar style="dark" />
      <View className="flex-1">
        {/* Profile Header */}
        <View className="items-center bg-white pt-8 pb-6 px-6">
          <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-4">
            <Text className="text-3xl font-bold text-white">
              {query.user?.fullName?.charAt(0)?.toUpperCase() || "U"}
            </Text>
          </View>
          <Text className="text-xl font-bold text-textPrimary">
            {query.user?.fullName || "User"}
          </Text>
          <Text className="text-sm text-textSecondary mt-0.5">
            {query.user?.email || ""}
          </Text>
          <TouchableOpacity
            className="mt-4 bg-[#F5F5F5] px-5 py-2 rounded-full flex-row items-center"
            onPress={router.navigateToProfile}
          >
            <Ionicons name="create-outline" size={16} color={COLORS.textPrimary} />
            <Text className="text-sm font-semibold text-textPrimary ml-1.5">
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View className="bg-white mx-4 mt-4 rounded-xl overflow-hidden border border-border/40">
          {MENU_ITEMS.map((item, index) => (
            <AccountMenuItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              route={item.route}
              onPress={router.navigateTo}
              showBorder={index !== MENU_ITEMS.length - 1}
            />
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          className="mx-4 mt-4 bg-white rounded-xl py-4 items-center flex-row justify-center border border-border/40"
          onPress={actions.handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text className="text-base font-semibold text-error ml-2">Logout</Text>
        </TouchableOpacity>

        <View className="py-10 items-center">
          <TalabatLogo size="sm" />
          <Text className="text-[11px] text-textTertiary mt-2">
            Version 1.0.0
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
