import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Store } from "@src/features/stores/types/store.types";
import { isStoreOpen } from "@src/utils/storeHours";
import { COLORS } from "@src/constants/theme";

interface StoreResultProps {
  store: Store & { distanceKm: number | null };
  onPress: () => void;
}

export function StoreResult({ store, onPress }: StoreResultProps) {
  const open = isStoreOpen(
    store.openTime,
    store.closeTime,
    store.overtimeOpenTime,
    store.overtimeCloseTime,
  );

  return (
    <TouchableOpacity
      className="flex-row items-center bg-white rounded-xl mb-2 p-3 border border-border/40"
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View className="w-14 h-14 rounded-lg overflow-hidden bg-[#F5F5F5] mr-3">
        {store.logoUrl ? (
          <Image source={{ uri: store.logoUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons name="storefront-outline" size={24} color={COLORS.textTertiary} />
          </View>
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-x-2 mb-0.5">
          <Text className="text-sm font-bold text-textPrimary flex-shrink" numberOfLines={1}>
            {store.name}
          </Text>
          {!open && (
            <View className="bg-[#F5F5F5] px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-semibold text-textTertiary">Closed</Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={12} color={COLORS.primary} />
          <Text className="text-xs text-primary font-medium ml-0.5">
            {store.deliveryTimeMinutes ?? 30} min
          </Text>
          <Text className="text-[8px] text-textTertiary mx-1">•</Text>
          <Text className="text-xs text-textSecondary">
            {store.deliveryFees ? `${store.deliveryFees} EGP` : "Free delivery"}
          </Text>
          {store.distanceKm != null && (
            <>
              <Text className="text-[8px] text-textTertiary mx-1">•</Text>
              <Text className="text-xs text-textSecondary">
                {store.distanceKm < 1
                  ? `${Math.round(store.distanceKm * 1000)}m`
                  : `${store.distanceKm.toFixed(1)}km`}
              </Text>
            </>
          )}
        </View>
        <View className="flex-row items-center mt-0.5">
          <Ionicons name="star" size={12} color={COLORS.star} />
          <Text className="text-xs font-semibold text-textPrimary ml-0.5">
            {Number(store.averageRating || 0).toFixed(1)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
