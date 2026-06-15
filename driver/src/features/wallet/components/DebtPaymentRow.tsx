import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@constants/theme";
import type { DebtPayment } from "../types/wallet.types";

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending Review",
    color: COLORS.warning,
    bg: COLORS.warningLight,
    icon: "time-outline" as const,
  },
  CONFIRMED: {
    label: "Confirmed",
    color: COLORS.success,
    bg: COLORS.successLight,
    icon: "checkmark-circle-outline" as const,
  },
  REJECTED: {
    label: "Rejected",
    color: COLORS.danger,
    bg: COLORS.dangerLight,
    icon: "close-circle-outline" as const,
  },
};

const METHOD_ICONS: Record<string, string> = {
  CREDIT_CARD: "card-outline",
  VODAFONE_CASH: "phone-portrait-outline",
  INSTAPAY: "flash-outline",
};

const METHOD_LABELS: Record<string, string> = {
  CREDIT_CARD: "Credit Card",
  VODAFONE_CASH: "Vodafone Cash",
  INSTAPAY: "InstaPay",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  item: DebtPayment;
}

export function DebtPaymentRow({ item: p }: Props) {
  const status = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING;

  return (
    <View
      className="bg-surface rounded-2xl p-4 border border-border mx-4 mb-3"
      style={{ elevation: 1 }}
    >
      {/* Header row */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <Ionicons
            name={(METHOD_ICONS[p.method] as any) || "cash-outline"}
            size={16}
            color={COLORS.textSecondary}
          />
          <Text className="font-bold text-textPrimary text-sm">
            {METHOD_LABELS[p.method] || p.method}
          </Text>
        </View>
        {/* Status badge */}
        <View
          className="flex-row items-center gap-1 px-2.5 py-1 rounded-full"
          style={{ backgroundColor: status.bg }}
        >
          <Ionicons name={status.icon} size={12} color={status.color} />
          <Text className="text-xs font-bold" style={{ color: status.color }}>
            {status.label}
          </Text>
        </View>
      </View>

      {/* Amount */}
      <Text className="text-2xl font-black text-textPrimary">
        EGP {Number(p.amount).toFixed(2)}
      </Text>
      <Text className="text-xs text-textTertiary mt-1">
        {formatDate(p.createdAt)}
      </Text>

      {/* Reference if exists */}
      {p.referenceNumber && (
        <Text className="text-xs text-textSecondary mt-2">
          Ref: {p.referenceNumber}
        </Text>
      )}

      {/* Rejection reason */}
      {p.status === "REJECTED" && p.rejectionReason && (
        <View
          className="mt-2 p-2 rounded-lg"
          style={{ backgroundColor: COLORS.dangerLight }}
        >
          <Text className="text-xs font-bold" style={{ color: COLORS.danger }}>
            Reason: {p.rejectionReason}
          </Text>
        </View>
      )}
    </View>
  );
}
