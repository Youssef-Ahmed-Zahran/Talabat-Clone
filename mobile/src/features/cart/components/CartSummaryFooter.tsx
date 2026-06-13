import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface CartSummaryFooterProps {
  subtotal: number;
  itemCount: number;
  onCheckout: () => void;
}

export function CartSummaryFooter({
  subtotal,
  itemCount,
  onCheckout,
}: CartSummaryFooterProps) {
  return (
    <View className="bg-white px-4 pt-4 pb-8 border-t border-border/40">
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-textSecondary text-xs font-medium">Subtotal</Text>
          <Text className="text-xl font-bold text-textPrimary">
            {subtotal.toFixed(2)} EGP
          </Text>
        </View>
        <View className="bg-primary/10 px-3 py-1 rounded-full">
          <Text className="text-primary font-semibold text-xs">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        className="bg-primary h-12 rounded-xl justify-center items-center"
        onPress={onCheckout}
        activeOpacity={0.9}
      >
        <Text className="text-white text-base font-bold">Proceed to Checkout</Text>
      </TouchableOpacity>
    </View>
  );
}
