import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Loader } from "@src/components/loader/Loader";
import { useOrderHistory } from "../hooks/useOrderHistory";
import { OrderCard } from "../components/OrderCard";
import { ReviewModal } from "../components/ReviewModal";
import { COLORS } from "@src/constants/theme";

export default function OrderHistoryScreen() {
  const { query, state, actions, router } = useOrderHistory();

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]" edges={["top"]}>
      <StatusBar style="dark" />

      <View className="px-4 py-4 bg-white border-b border-border/40">
        <Text className="text-xl font-bold text-textPrimary">My Orders</Text>
        {query.orders && query.orders.length > 0 && (
          <Text className="text-sm text-textTertiary mt-0.5">
            {query.orders.length} orders
          </Text>
        )}
      </View>

      {query.isLoading && !query.orders ? (
        <Loader message="Loading your orders..." />
      ) : (
        <FlatList
          data={query?.orders || []}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) =>
            item.items !== undefined ? (
              <OrderCard
                item={item}
                isReordering={state.reorderingId === item.id}
                onTrack={() => actions.handleTrack(item.id)}
                onReorder={() => actions.handleReorder(item.id, item.storeId)}
                onReview={() => actions.handleReview(item)}
              />
            ) : null
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          onRefresh={actions.onRefresh}
          refreshing={state.refreshing}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <View className="w-20 h-20 bg-[#F5F5F5] rounded-full items-center justify-center mb-4">
                <Ionicons
                  name="receipt-outline"
                  size={40}
                  color={COLORS.textTertiary}
                />
              </View>
              <Text className="text-lg font-bold text-textPrimary">
                No orders yet
              </Text>
              <Text className="text-sm text-textSecondary mt-2 text-center px-8">
                Place your first order and it will show up here
              </Text>
              <TouchableOpacity
                className="mt-6 bg-primary px-8 h-12 rounded-xl items-center justify-center"
                onPress={router.navigateHome}
              >
                <Text className="text-base font-bold text-white">
                  Find Food
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Review Modal */}
      {state.selectedReviewOrder && (
        <ReviewModal
          visible={!!state.selectedReviewOrder}
          onClose={actions.closeReviewModal}
          storeId={state.selectedReviewOrder.storeId}
          orderId={state.selectedReviewOrder.id}
          storeName={state.selectedReviewOrder.store?.name || "Store"}
        />
      )}
    </SafeAreaView>
  );
}
