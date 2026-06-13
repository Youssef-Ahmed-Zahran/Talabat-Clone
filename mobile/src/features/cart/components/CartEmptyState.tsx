import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@src/constants/theme";

interface CartEmptyStateProps {
  onExplore: () => void;
}

export function CartEmptyState({ onExplore }: CartEmptyStateProps) {
  return (
    <View className="flex-1 justify-center items-center px-10">
      <View className="w-24 h-24 bg-[#F5F5F5] rounded-full items-center justify-center mb-6">
        <Ionicons name="bag-outline" size={48} color={COLORS.textTertiary} />
      </View>
      <Text className="text-xl font-bold text-textPrimary text-center mb-1">
        Your cart is empty
      </Text>
      <Text className="text-sm text-textSecondary text-center mb-8">
        Add items from a restaurant to get started
      </Text>
      <TouchableOpacity
        className="bg-primary px-8 py-3 rounded-xl"
        onPress={onExplore}
      >
        <Text className="text-white text-base font-bold">
          Explore Restaurants
        </Text>
      </TouchableOpacity>
    </View>
  );
}
