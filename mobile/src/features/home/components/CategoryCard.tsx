import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { MainCategory } from "@src/features/stores/types/store.types";
import { COLORS } from "@src/constants/theme";
import { CategoryCardProps } from "../types/home.types";
export function CategoryCard({ category, onPress }: CategoryCardProps) {
  return (
    <TouchableOpacity
      className="items-center w-[84px] mr-3"
      onPress={() => onPress(category.id, category.name)}
      activeOpacity={0.8}
    >
      <View className="w-[80px] h-[80px] rounded-[24px] bg-[#FAF5ED] items-center justify-center mb-2 overflow-hidden">
        {category.imageUrl ? (
          <Image
            source={{ uri: category.imageUrl }}
            className="w-[64px] h-[64px]"
            resizeMode="contain"
          />
        ) : (
          <View className="w-[50px] h-[50px] bg-primary/10 rounded-2xl items-center justify-center">
            <Ionicons
              name="restaurant-outline"
              size={24}
              color={COLORS.primary}
            />
          </View>
        )}
      </View>
      <Text
        className="text-[12px] font-bold text-[#1A1A1A] text-center leading-tight px-1"
        numberOfLines={2}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}
