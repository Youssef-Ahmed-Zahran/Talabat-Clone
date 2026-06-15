import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@constants/theme";
import type { WalletTransaction } from "../types/wallet.types";

const TYPE_CONFIG: Record<
  WalletTransaction["type"],
  { label: string; icon: string; color: string }
> = {
  CASH_ORDER_DEBIT: {
    label: "Cash Collected",
    icon: "cash-outline",
    color: COLORS.danger,
  },
  DELIVERY_FEE_CREDIT: {
    label: "Delivery Fee",
    icon: "bicycle-outline",
    color: COLORS.success,
  },
  ADMIN_TOP_UP: {
    label: "Admin Top-Up",
    icon: "add-circle-outline",
    color: COLORS.primary,
  },
  ADMIN_DEBIT: {
    label: "Admin Debit",
    icon: "remove-circle-outline",
    color: COLORS.danger,
  },
  PAYOUT: {
    label: "Payout",
    icon: "arrow-up-circle-outline",
    color: COLORS.success,
  },
  DEBT_REPAYMENT: {
    label: "Debt Repaid",
    icon: "checkmark-circle-outline",
    color: COLORS.success,
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-EG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  transactions: WalletTransaction[];
}

export function TransactionRow({ item }: { item: WalletTransaction }) {
  const cfg = TYPE_CONFIG[item.type] ?? {
    label: item.type,
    icon: "receipt-outline",
    color: COLORS.textSecondary,
  };
  const amount = Number(item.amount);
  const isCredit = amount > 0;

  return (
    <View className="flex-row items-center px-4 py-3.5 bg-surface border-b border-border">
      {/* Icon */}
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: `${cfg.color}15` }}
      >
        <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
      </View>

      {/* Label + date */}
      <View className="flex-1">
        <Text className="text-textPrimary font-semibold text-sm">
          {cfg.label}
        </Text>
        <Text className="text-textTertiary text-xs mt-0.5">
          {formatDate(item.createdAt)}
        </Text>
        {item.note && (
          <Text className="text-textTertiary text-xs mt-0.5" numberOfLines={1}>
            {item.note}
          </Text>
        )}
      </View>

      {/* Amount + balance after */}
      <View className="items-end">
        <Text
          className="font-black text-base"
          style={{ color: isCredit ? COLORS.success : COLORS.danger }}
        >
          {isCredit ? "+" : ""}
          {amount.toFixed(2)} EGP
        </Text>
        <Text className="text-textTertiary text-xs mt-0.5">
          {Number(item.balanceAfter).toFixed(2)} EGP
        </Text>
      </View>
    </View>
  );
}
