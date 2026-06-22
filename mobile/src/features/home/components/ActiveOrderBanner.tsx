import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@src/constants/theme";
import { ActiveOrderBannerProps } from "../types/home.types";
export function ActiveOrderBanner({
  currentStatus,
  currentStep,
  STATUS_STEPS,
  deliveryType,
  onPress,
}: ActiveOrderBannerProps) {
  const isStoreDelivery = deliveryType === "STORE_DELIVERY";

  return (
    <View className="px-4 mb-2">
      <TouchableOpacity
        className="rounded-xl p-4 bg-primary flex-row items-center"
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3">
          <Ionicons name="bicycle" size={20} color={COLORS.white} />
        </View>
        <View className="flex-1">
          <Text className="text-white text-sm font-bold">
            Order in progress
          </Text>
          <Text className="text-white/80 text-xs font-medium capitalize mt-0.5">
            {isStoreDelivery
              ? "Store is handling your delivery"
              : currentStatus.replace(/_/g, " ")}
          </Text>

          {!isStoreDelivery && (
            <View className="flex-row items-center mt-2 gap-x-1">
              {STATUS_STEPS.map((s, i) => (
                <View
                  key={s}
                  className={`h-1 flex-1 rounded-full ${i <= currentStep ? "bg-white" : "bg-white/30"}`}
                />
              ))}
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}
