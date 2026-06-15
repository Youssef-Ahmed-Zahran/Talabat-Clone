import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@constants/theme";

interface Props {
  balance: number;
  debt: number;
  hasDebt: boolean;
  isSuspended: boolean;
  onPayDebt: () => void;
}

export function WalletBalanceCard({
  balance,
  debt,
  hasDebt,
  isSuspended,
  onPayDebt,
}: Props) {
  const isPositive = balance >= 0;

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: isPositive ? COLORS.primary : COLORS.danger,
      }}
    >
      {/* Suspended Banner */}
      {isSuspended && (
        <View className="bg-black/30 px-4 py-2 flex-row items-center gap-2">
          <Ionicons name="warning-outline" size={14} color="white" />
          <Text className="text-white text-xs font-bold">
            Account suspended — clear your debt to resume
          </Text>
        </View>
      )}

      {/* Main Balance */}
      <View className="px-6 pt-6 pb-5 items-center">
        <Text className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">
          {hasDebt ? "Outstanding Debt" : "Wallet Balance"}
        </Text>
        <Text className="text-white font-black" style={{ fontSize: 44 }}>
          {hasDebt ? `-${debt.toFixed(2)}` : balance.toFixed(2)}
          {"  "}
          <Text style={{ fontSize: 22, fontWeight: "600", opacity: 0.8 }}>
            EGP
          </Text>
        </Text>
        {hasDebt && (
          <Text className="text-white/60 text-sm mt-1 text-center">
            You owe Talabat for collected cash orders
          </Text>
        )}
      </View>

      {/* Pay Debt Button */}
      {hasDebt && (
        <TouchableOpacity
          onPress={onPayDebt}
          activeOpacity={0.85}
          className="mx-5 mb-5 py-4 rounded-2xl items-center"
          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="wallet-outline" size={18} color="white" />
            <Text className="text-white font-black text-base">
              Pay Debt — EGP {debt.toFixed(2)}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Stats Row */}
      <View className="flex-row border-t border-white/20">
        <View className="flex-1 py-3 items-center border-r border-white/20">
          <Text className="text-white/60 text-xs font-semibold uppercase">
            Status
          </Text>
          <Text className="text-white font-black text-sm mt-0.5">
            {isSuspended
              ? "🔴 Suspended"
              : isPositive
                ? "🟢 Active"
                : "🟡 Debt"}
          </Text>
        </View>
        <View className="flex-1 py-3 items-center">
          <Text className="text-white/60 text-xs font-semibold uppercase">
            Balance
          </Text>
          <Text className="text-white font-black text-sm mt-0.5">
            {isPositive
              ? `+${balance.toFixed(0)} EGP`
              : `${balance.toFixed(0)} EGP`}
          </Text>
        </View>
      </View>
    </View>
  );
}
