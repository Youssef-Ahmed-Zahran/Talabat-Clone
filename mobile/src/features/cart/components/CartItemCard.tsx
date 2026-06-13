import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { CartItem as CartItemType } from "@src/features/cart/types/cart.types";
import { COLORS } from "@src/constants/theme";

interface CartItemCardProps {
  item: CartItemType;
  onUpdateQty: (itemId: string, quantity: number) => void;
}

export function CartItemCard({ item, onUpdateQty }: CartItemCardProps) {
  const total =
    Number(item.unitPrice) +
    (item.options?.reduce(
      (s, o) => s + (Number(o.optionValue?.extraPrice) || 0),
      0,
    ) || 0);

  return (
    <View className="flex-row items-center bg-white rounded-xl p-3 mb-3 border border-border/40">
      <View className="w-[72px] h-[72px] rounded-lg bg-[#F5F5F5] items-center justify-center mr-3 overflow-hidden">
        {item.product?.imageUrl ? (
          <Image
            source={{ uri: item.product.imageUrl }}
            className="w-full h-full"
          />
        ) : (
          <Ionicons name="fast-food-outline" size={28} color={COLORS.textTertiary} />
        )}
      </View>

      <View className="flex-1">
        <Text className="text-sm font-bold text-textPrimary mb-0.5" numberOfLines={1}>
          {item.product?.name || "Item"}
        </Text>
        {item.options && item.options.length > 0 && (
          <Text className="text-xs text-textTertiary mb-1" numberOfLines={1}>
            {item.options
              .map((opt) => opt.optionValue?.name)
              .filter(Boolean)
              .join(", ")}
          </Text>
        )}
        <Text className="text-sm font-bold text-primary">{total.toFixed(2)} EGP</Text>
      </View>

      <View className="flex-row items-center bg-[#F5F5F5] rounded-lg p-0.5">
        <TouchableOpacity
          className="w-8 h-8 rounded-md items-center justify-center bg-white"
          onPress={() => onUpdateQty(item.id, item.quantity - 1)}
        >
          <Ionicons name="remove" size={16} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text className="mx-2.5 text-sm font-bold text-textPrimary">{item.quantity}</Text>
        <TouchableOpacity
          className="w-8 h-8 rounded-md items-center justify-center bg-primary"
          onPress={() => onUpdateQty(item.id, item.quantity + 1)}
        >
          <Ionicons name="add" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
