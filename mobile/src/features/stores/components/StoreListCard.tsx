import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Store } from "@src/features/stores/types/store.types";
import { COLORS } from "@src/constants/theme";

interface StoreListCardProps {
  store: Store;
  onPress: (storeId: string) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (storeId: string) => void;
}

export function StoreListCard({
  store,
  onPress,
  isWishlisted = false,
  onToggleWishlist,
}: StoreListCardProps) {
  return (
    <TouchableOpacity
      className="bg-white rounded-2xl mb-3 flex-row overflow-hidden border border-border/30 p-3 items-center"
      onPress={() => onPress(store.id)}
      activeOpacity={0.85}
    >
      {/* Left side: Image with Heart overlay */}
      <View className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-50 relative mr-3">
        {store.coverUrl ? (
          <Image
            source={{ uri: store.coverUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons
              name="restaurant-outline"
              size={28}
              color={COLORS.textTertiary}
            />
          </View>
        )}

        {/* Heart/Favorite Overlay */}
        <TouchableOpacity
          className="absolute top-1.5 left-1.5 z-10 w-7 h-7 rounded-full bg-black/20 items-center justify-center"
          onPress={() => onToggleWishlist?.(store.id)}
        >
          <Ionicons
            name={isWishlisted ? "heart" : "heart-outline"}
            size={16}
            color={isWishlisted ? COLORS.primary : COLORS.white}
          />
        </TouchableOpacity>
      </View>

      {/* Right side: details (LTR aligned) */}
      <View className="flex-1 items-start justify-center">
        {/* Name */}
        <Text
          className="text-base font-bold text-textPrimary text-left mb-1"
          numberOfLines={1}
        >
          {store.name}
        </Text>

        {/* Rating */}
        <View className="flex-row items-center mb-1">
          <Ionicons name="star" size={12} color={COLORS.star} />
          <Text className="text-xs font-bold text-textPrimary ml-1 mr-1.5">
            {Number(store.averageRating || 0).toFixed(1)}
          </Text>
          <Text className="text-xs text-textSecondary">
            Google Maps ({store.totalReviews || 54})
          </Text>
        </View>

        {/* Time & Cost */}
        <Text className="text-xs text-textSecondary text-left">
          {store.deliveryTimeMinutes || 45} mins •{" "}
          {store.deliveryFees
            ? `${Number(store.deliveryFees).toFixed(2)} EGP`
            : "Free Delivery"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
