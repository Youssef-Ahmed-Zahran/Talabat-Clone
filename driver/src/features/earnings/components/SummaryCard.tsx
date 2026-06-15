import React from "react";
import { View, Text } from "react-native";
import { Period, PERIOD_LABELS } from "../types/earnings.types";

export function SummaryCard({
  summary,
  totalDeliveries,
  period,
}: {
  summary: {
    totalAmount?: number | null;
    tipAmount?: number | null;
    baseAmount?: number | null;
  };
  totalDeliveries: number;
  period: Period;
}) {
  const total = Number(summary?.totalAmount ?? 0);
  const tips = Number(summary?.tipAmount ?? 0);
  const base = Number(summary?.baseAmount ?? 0);

  return (
    <View className="mx-4 mt-4 rounded-3xl overflow-hidden bg-primary">
      {/* Main total */}
      <View className="px-6 pt-6 pb-4 items-center">
        <Text className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">
          {PERIOD_LABELS[period]} Earnings
        </Text>
        <Text className="text-white text-4xl font-black">
          {total.toFixed(2)}{" "}
          <Text className="text-2xl font-semibold text-white/80">EGP</Text>
        </Text>
        <Text className="text-white/60 text-sm mt-1">
          {totalDeliveries} deliveries
        </Text>
      </View>

      {/* Row stats */}
      <View className="flex-row border-t border-white/20">
        <View className="flex-1 py-4 items-center border-r border-white/20">
          <Text className="text-white/60 text-xs uppercase font-semibold">
            Base
          </Text>
          <Text className="text-white text-base font-black mt-0.5">
            {base.toFixed(0)} EGP
          </Text>
        </View>
        <View className="flex-1 py-4 items-center">
          <Text className="text-white/60 text-xs uppercase font-semibold">
            Tips
          </Text>
          <Text className="text-white text-base font-black mt-0.5">
            {tips.toFixed(0)} EGP
          </Text>
        </View>
      </View>
    </View>
  );
}
