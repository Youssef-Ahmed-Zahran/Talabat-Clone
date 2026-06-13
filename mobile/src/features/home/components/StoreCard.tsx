import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Store } from "@src/features/stores/types/store.types";
import { isStoreOpen, storeHoursLabel } from "@src/utils/storeHours";
import { COLORS } from "@src/constants/theme";

interface StoreCardProps {
  store: Store;
  onPress: (storeId: string) => void;
}

export function StoreCard({ store, onPress }: StoreCardProps) {
  const open = isStoreOpen(
    store.openTime,
    store.closeTime,
    store.overtimeOpenTime,
    store.overtimeCloseTime,
  );
  const hoursLabel = storeHoursLabel(
    store.openTime,
    store.closeTime,
    store.overtimeOpenTime,
    store.overtimeCloseTime,
  );
  const hasHours = !!store.openTime && !!store.closeTime;

  return (
    <TouchableOpacity
      className={`bg-white rounded-xl mb-3 flex-row overflow-hidden border border-border/40 ${!open ? "opacity-70" : ""}`}
      onPress={() => onPress(store.id)}
      activeOpacity={0.85}
    >
      {/* Store image */}
      <View className="w-[100px] h-[100px] bg-[#F5F5F5] relative">
        {store.coverUrl ? (
          <Image source={{ uri: store.coverUrl }} className="w-full h-full" />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons name="storefront-outline" size={32} color={COLORS.textTertiary} />
          </View>
        )}
        {!open && hasHours && (
          <View className="absolute inset-0 bg-black/40 items-center justify-center">
            <Text className="text-white font-bold text-[10px] tracking-wide">CLOSED</Text>
          </View>
        )}
      </View>

      {/* Store info */}
      <View className="flex-1 p-3 justify-center">
        <View className="flex-row items-start justify-between mb-1">
          <Text
            className="text-base font-bold text-textPrimary flex-1 mr-2"
            numberOfLines={1}
          >
            {store.name}
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="star" size={12} color={COLORS.star} />
            <Text className="text-xs font-bold text-textPrimary ml-0.5">
              {Number(store.averageRating || 0).toFixed(1)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mb-1">
          <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
          <Text className="text-xs text-textSecondary ml-1">
            {store.deliveryTimeMinutes || "30"} min
          </Text>
          <Text className="text-textTertiary mx-1.5 text-[8px]">•</Text>
          <Text className="text-xs text-textSecondary">
            {store.deliveryFees ? `${store.deliveryFees} EGP` : "Free delivery"}
          </Text>
        </View>

        {store.minimumOrderCost > 0 && (
          <Text className="text-xs text-textTertiary">
            Min. order {store.minimumOrderCost} EGP
          </Text>
        )}

        {hoursLabel && (
          <Text
            className={`text-[11px] font-medium mt-0.5 ${open ? "text-emerald-600" : "text-textTertiary"}`}
          >
            {hoursLabel}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
