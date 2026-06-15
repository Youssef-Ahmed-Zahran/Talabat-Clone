import React from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@constants/theme";
import { useDeliveryHistoryScreen } from "../hooks/useDeliveryHistoryScreen";

export default function DeliveryHistoryScreen() {
  const { query, actions } = useDeliveryHistoryScreen();

  if (query.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surfaceAlt" edges={["top"]}>
      {/* Header */}
      <View className="bg-surface px-5 pt-4 pb-4 border-b border-border">
        <Text className="text-2xl font-bold text-textPrimary">
          Delivery History
        </Text>
        <Text className="text-sm text-textSecondary mt-1">
          {query.pagination?.total ?? 0} total deliveries
        </Text>
      </View>

      {/* Summary row */}
      {query.summary && (
        <View className="flex-row mx-4 mt-4 gap-3">
          <View className="flex-1 bg-surface rounded-2xl p-4 border border-border items-center">
            <Ionicons name="cash-outline" size={20} color={COLORS.success} />
            <Text className="text-lg font-bold text-textPrimary mt-1">
              {Number(query.summary.totalAmount ?? 0).toFixed(2)} EGP
            </Text>
            <Text className="text-xs text-textSecondary">Total Earned</Text>
          </View>
          <View className="flex-1 bg-surface rounded-2xl p-4 border border-border items-center">
            <Ionicons name="heart-outline" size={20} color={COLORS.primary} />
            <Text className="text-lg font-bold text-textPrimary mt-1">
              {Number(query.summary.tipAmount ?? 0).toFixed(2)} EGP
            </Text>
            <Text className="text-xs text-textSecondary">Tips</Text>
          </View>
        </View>
      )}

      <FlatList
        data={query.earnings}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pt-3 pb-6"
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={actions.refetch}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-surface rounded-2xl p-4 mb-3 border border-border flex-row items-center"
            activeOpacity={0.8}
          >
            <View className="w-10 h-10 rounded-full bg-successLight items-center justify-center mr-3">
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={COLORS.success}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-textPrimary">
                Order #{item.orderId.slice(-6).toUpperCase()}
              </Text>
              <Text className="text-xs text-textSecondary mt-0.5">
                {new Date(item.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-base font-bold text-success">
                +{Number(item.totalAmount).toFixed(2)} EGP
              </Text>
              {Number(item.tipAmount) > 0 && (
                <Text className="text-xs text-textSecondary">
                  incl. {Number(item.tipAmount).toFixed(2)} tip
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons
              name="cube-outline"
              size={48}
              color={COLORS.textTertiary}
            />
            <Text className="text-textSecondary text-base mt-3">
              No deliveries yet
            </Text>
            <Text className="text-textTertiary text-sm mt-1 text-center">
              Go online and start accepting orders!
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (query.hasNextPage) {
            actions.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
