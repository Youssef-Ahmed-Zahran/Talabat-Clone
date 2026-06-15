import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@constants/theme";
import { Earning } from "../types/earnings.types";
import { formatDate } from "../utils/earnings.utils";

export function EarningRow({ item }: { item: Earning }) {
  const total = Number(item.totalAmount);
  const tip = Number(item.tipAmount);
  const base = Number(item.baseAmount);

  return (
    <View className="bg-surface rounded-2xl mx-4 mb-3 overflow-hidden border border-border">
      {/* Top row */}
      <View className="flex-row items-center justify-between px-4 py-3.5">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-primarySoft items-center justify-center">
            <Ionicons name="bicycle" size={18} color={COLORS.primary} />
          </View>
          <View>
            <Text className="text-sm font-bold text-textPrimary">
              Delivery Completed
            </Text>
            <Text className="text-xs text-textTertiary mt-0.5">
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>
        <Text className="text-base font-black text-primary">
          +{total.toFixed(2)} EGP
        </Text>
      </View>

      {/* Detail row */}
      {(tip > 0 || !item.paidOut) && (
        <View className="flex-row items-center px-4 py-2 border-t border-border gap-4 bg-surfaceAlt">
          {tip > 0 && (
            <View className="flex-row items-center gap-1">
              <Text className="text-xs text-textSecondary">Base:</Text>
              <Text className="text-xs font-semibold text-textPrimary">
                {base.toFixed(2)} EGP
              </Text>
              <Text className="text-xs text-textTertiary mx-1">·</Text>
              <Text className="text-xs text-textSecondary">Tip:</Text>
              <Text className="text-xs font-semibold text-success">
                +{tip.toFixed(2)} EGP
              </Text>
            </View>
          )}
          {!item.paidOut && (
            <View className="ml-auto flex-row items-center gap-1 bg-warningLight px-2 py-0.5 rounded-full">
              <View className="w-1.5 h-1.5 rounded-full bg-warning" />
              <Text className="text-[10px] font-bold text-warning">
                Pending payout
              </Text>
            </View>
          )}
          {item.paidOut && (
            <View className="ml-auto flex-row items-center gap-1 bg-successLight px-2 py-0.5 rounded-full">
              <View className="w-1.5 h-1.5 rounded-full bg-success" />
              <Text className="text-[10px] font-bold text-success">
                Paid out
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
