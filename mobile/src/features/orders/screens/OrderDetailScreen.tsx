import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Loader } from "@src/components/loader/Loader";
import { useOrderDetail } from "../hooks/useOrderDetail";
import { StatusBanner } from "../components/StatusBadge";
import { COLORS } from "@src/constants/theme";

export default function OrderDetailScreen() {
  const { query, router } = useOrderDetail();

  if (query.isLoading) return <Loader message="Loading order details..." />;

  if (!query.order) {
    return (
      <SafeAreaView
        className="flex-1 bg-[#F5F5F5] items-center justify-center"
        edges={["top"]}
      >
        <StatusBar style="dark" />
        <Ionicons name="receipt-outline" size={56} color={COLORS.textTertiary} />
        <Text className="text-lg font-bold text-textPrimary mt-4">
          Order not found
        </Text>
        <Text className="text-sm text-textSecondary mt-1 text-center px-12">
          This order could not be loaded.
        </Text>
        <TouchableOpacity
          className="mt-6 bg-primary px-8 h-12 rounded-xl items-center justify-center flex-row"
          onPress={router.goBack}
        >
          <Ionicons name="arrow-back" size={18} color={COLORS.white} />
          <Text className="text-sm font-bold text-white ml-1.5">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const order = query.order;
  const items = order.items ?? [];
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]" edges={["top"]}>
      <StatusBar style="dark" />

      <View className="px-4 py-4 bg-white border-b border-border/40">
        <TouchableOpacity onPress={router.goBack} className="flex-row items-center mb-2">
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text className="text-primary font-semibold text-sm ml-1">Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-textPrimary">Order Details</Text>
        <Text className="text-sm text-textTertiary mt-0.5">{formattedDate}</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white rounded-xl border border-border/40 overflow-hidden mb-3">
          <StatusBanner status={order.status} />
          <View className="px-4 py-4 gap-y-2">
            <Text className="text-lg font-bold text-textPrimary">
              {order.store?.name || "Store"}
            </Text>

            <View className="flex-row justify-between py-2 border-b border-border/20">
              <Text className="text-sm text-textSecondary">Date</Text>
              <Text className="text-sm font-medium text-textPrimary">{formattedDate}</Text>
            </View>

            <View className="flex-row justify-between py-2 border-b border-border/20">
              <Text className="text-sm text-textSecondary">Delivery Fees</Text>
              <Text className="text-sm font-medium text-textPrimary">
                {Number(order.deliveryFees ?? 0) === 0
                  ? "Free"
                  : `${Number(order.deliveryFees).toFixed(2)} EGP`}
              </Text>
            </View>

            <View className="flex-row justify-between py-2">
              <Text className="text-base font-bold text-textPrimary">Total</Text>
              <Text className="text-base font-bold text-primary">
                {Number(order.totalAmount ?? 0).toFixed(2)} EGP
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-white rounded-xl border border-border/40 overflow-hidden mb-3">
          <View className="px-4 py-4">
            <Text className="text-xs font-semibold text-textTertiary uppercase mb-3">
              Items ({items.length})
            </Text>

            {items.length > 0 ? (
              items.map((orderItem: any, idx: number) => {
                const itemTotal =
                  Number(orderItem.price_snapshot) * orderItem.quantity;
                return (
                  <View
                    key={idx}
                    className={`flex-row justify-between items-center py-2.5 ${
                      idx < items.length - 1 ? "border-b border-border/20" : ""
                    }`}
                  >
                    <View className="flex-row items-center flex-1 mr-3">
                      <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center mr-2">
                        <Text className="text-[10px] font-bold text-primary">
                          {orderItem.quantity}×
                        </Text>
                      </View>
                      <Text
                        className="text-sm font-medium text-textPrimary flex-1"
                        numberOfLines={2}
                      >
                        {orderItem.name_snapshot}
                      </Text>
                    </View>
                    <Text className="text-sm font-semibold text-textPrimary">
                      {itemTotal.toFixed(2)} EGP
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text className="text-sm text-textTertiary">No item details available.</Text>
            )}
          </View>
        </View>

        {order.deliveryInstructions && (
          <View className="bg-white rounded-xl border border-border/40 overflow-hidden mb-3">
            <View className="px-4 py-4">
              <Text className="text-xs font-semibold text-textTertiary uppercase mb-2">
                Delivery Instructions
              </Text>
              <Text className="text-sm text-textPrimary">{order.deliveryInstructions}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
