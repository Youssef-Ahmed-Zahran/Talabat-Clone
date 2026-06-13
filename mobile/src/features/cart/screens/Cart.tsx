import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useCartScreen } from "../hooks/useCart";
import { CartItemCard } from "../components/CartItemCard";
import { CartEmptyState } from "../components/CartEmptyState";
import { CartSummaryFooter } from "../components/CartSummaryFooter";
import { COLORS } from "@src/constants/theme";
import type { CartItem } from "@src/features/cart/types/cart.types";

export default function CartScreen() {
  const { query, actions, router } = useCartScreen();

  if (query.itemCount === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <View className="px-4 py-4 border-b border-border/40">
          <Text className="text-xl font-bold text-textPrimary">Cart</Text>
        </View>
        <CartEmptyState onExplore={router.navigateToHome} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]">
      <StatusBar style="dark" />
      <View className="flex-row justify-between items-center px-4 py-4 bg-white border-b border-border/40">
        <Text className="text-xl font-bold text-textPrimary">Cart</Text>
        <TouchableOpacity
          onPress={actions.handleClear}
          className="flex-row items-center"
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          <Text className="text-error font-semibold text-sm ml-1">Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={query.items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }: { item: CartItem }) => (
          <CartItemCard item={item} onUpdateQty={actions.handleUpdateQty} />
        )}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />

      <CartSummaryFooter
        subtotal={query.subtotal}
        itemCount={query.itemCount}
        onCheckout={router.navigateToCheckout}
      />
    </SafeAreaView>
  );
}
