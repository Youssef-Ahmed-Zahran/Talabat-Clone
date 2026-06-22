import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SearchProduct } from "../types/home.types";
import { COLORS } from "@src/constants/theme";
import { ProductResultProps } from "../types/home.types";
export function ProductResult({ product, onPress }: ProductResultProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center bg-white rounded-xl mb-2 p-3 border border-border/40"
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View className="w-14 h-14 rounded-lg overflow-hidden bg-[#F5F5F5] mr-3">
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons
              name="restaurant-outline"
              size={24}
              color={COLORS.textTertiary}
            />
          </View>
        )}
      </View>

      <View className="flex-1">
        <Text className="text-sm font-bold text-textPrimary" numberOfLines={1}>
          {product.name}
        </Text>
        <Text className="text-xs text-textSecondary mt-0.5" numberOfLines={1}>
          {product.store?.name}
        </Text>
        <Text className="text-sm font-bold text-primary mt-0.5">
          {Number(product.price).toFixed(2)} EGP
        </Text>
      </View>

      <View className="bg-primary/10 px-2.5 py-1 rounded-lg">
        <Text className="text-xs font-semibold text-primary">View</Text>
      </View>
    </TouchableOpacity>
  );
}
