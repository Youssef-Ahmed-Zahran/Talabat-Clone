import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Product } from "@src/features/stores/types/store.types";
import { COLORS } from "@src/constants/theme";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  layout?: "list" | "grid";
}

export function ProductCard({ product, onAddToCart, layout = "list" }: ProductCardProps) {
  if (layout === "grid") {
    return (
      <TouchableOpacity
        className="w-[47.5%] mb-6"
      onPress={() => onAddToCart(product)}
      activeOpacity={0.85}
    >
      {/* Top: Image container */}
      <View className="w-full aspect-square rounded-2xl overflow-hidden bg-[#F5F5F5] relative mb-2.5">
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons name="restaurant-outline" size={32} color={COLORS.textTertiary} />
          </View>
        )}

        {/* Plus Overlay Button */}
        <TouchableOpacity
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white border border-[#FF5A00] items-center justify-center shadow-sm"
          onPress={() => onAddToCart(product)}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={18} color="#FF5A00" />
        </TouchableOpacity>
      </View>

      {/* Bottom: Info */}
      <View className="px-1 flex-1">
        <Text className="text-[13px] font-bold text-textPrimary text-left leading-[18px]" numberOfLines={2}>
          {product.name}
        </Text>
        <Text className="text-[13px] text-textPrimary mt-1">
          EGP <Text className="font-bold">{Number(product.price).toFixed(2)}</Text>
        </Text>
      </View>
    </TouchableOpacity>
    );
  }

  // List layout (default)
  return (
    <TouchableOpacity
      className="flex-row items-center bg-white rounded-2xl p-3 mb-3 border border-border/30 justify-between"
      onPress={() => onAddToCart(product)}
      activeOpacity={0.85}
    >
      {/* Left side: Info & Price */}
      <View className="flex-1 pr-3 items-start">
        <Text className="text-sm font-bold text-textPrimary text-left" numberOfLines={2}>
          {product.name}
        </Text>
        {product.description ? (
          <Text className="text-[11px] text-textSecondary mt-1 leading-normal text-left" numberOfLines={2}>
            {product.description}
          </Text>
        ) : null}
        <Text className="text-sm font-bold text-textPrimary mt-2">
          {Number(product.price).toFixed(2)} EGP
        </Text>
      </View>

      {/* Right side: Image with Plus button overlay */}
      <View className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-50 relative ml-2">
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons name="restaurant-outline" size={26} color={COLORS.textTertiary} />
          </View>
        )}

        {/* Plus Overlay Button */}
        <TouchableOpacity
          className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-primary items-center justify-center shadow-md"
          onPress={() => onAddToCart(product)}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
