import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@constants/theme";

import { PERIOD_LABELS, type Period } from "../types/earnings.types";
import { SummaryCard } from "../components/SummaryCard";
import { EarningRow } from "../components/EarningRow";
import { useEarningsScreen } from "../hooks/useEarningsScreen";

export default function EarningsScreen() {
  const { query, state: filters, actions } = useEarningsScreen();

  return (
    <SafeAreaView className="flex-1 bg-surfaceAlt" edges={["top"]}>
      {/* Header */}
      <View className="px-5 pt-4 pb-3 bg-surface border-b border-border">
        <Text className="text-2xl font-black text-textPrimary">Earnings</Text>
        <Text className="text-sm text-textSecondary mt-0.5">
          Your delivery earnings breakdown
        </Text>
      </View>

      <FlatList
        data={query.earnings}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isManualRefreshing}
            onRefresh={actions.refetch}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Summary card */}
            <SummaryCard
              summary={query.summary}
              totalDeliveries={query.totalDeliveries}
              period={filters.period}
            />

            {/* Period tabs */}
            <View className="flex-row mx-4 mt-4 mb-4 gap-2 flex-wrap">
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => filters.setPeriod(p)}
                  className={`px-4 py-2 rounded-full border ${
                    filters.period === p
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                  activeOpacity={0.8}
                >
                  <Text
                    className={`text-xs font-bold ${
                      filters.period === p ? "text-white" : "text-textSecondary"
                    }`}
                  >
                    {PERIOD_LABELS[p]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Section label / fetching indicator */}
            {query.isFetching && !query.isFetchingNextPage ? (
              <View className="flex-row items-center mx-4 mb-3 gap-2">
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text className="text-xs font-bold text-textSecondary">
                  Loading trips...
                </Text>
              </View>
            ) : query.earnings.length > 0 ? (
              <Text className="mx-4 mb-3 text-xs font-black text-textTertiary uppercase tracking-widest">
                {query.totalDeliveries}{" "}
                {query.totalDeliveries === 1 ? "Trip" : "Trips"} ·{" "}
                {PERIOD_LABELS[filters.period]}
              </Text>
            ) : null}
          </>
        }
        renderItem={({ item }) => <EarningRow item={item} />}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          !query.isFetching ? (
            <View className="items-center py-20 mx-4">
              <View className="w-20 h-20 rounded-full bg-primarySoft items-center justify-center mb-4">
                <Ionicons
                  name="receipt-outline"
                  size={36}
                  color={COLORS.primary}
                />
              </View>
              <Text className="text-lg font-black text-textPrimary">
                No earnings yet
              </Text>
              <Text className="text-sm text-textSecondary mt-2 text-center px-8">
                {filters.period === "all"
                  ? "Complete your first delivery to see earnings here."
                  : `No deliveries for ${PERIOD_LABELS[filters.period].toLowerCase()}. Try a different period.`}
              </Text>
            </View>
          ) : null
        }
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
