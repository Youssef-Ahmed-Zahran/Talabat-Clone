import React from "react";
import { View, Text } from "react-native";

export const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  PENDING:            { bg: "bg-amber-50",   text: "text-amber-600",   dot: "bg-amber-400",   label: "Pending" },
  CONFIRMED:          { bg: "bg-blue-50",    text: "text-blue-600",    dot: "bg-blue-400",    label: "Confirmed" },
  PREPARING:          { bg: "bg-blue-50",    text: "text-blue-600",    dot: "bg-blue-400",    label: "Preparing" },
  READY_FOR_PICKUP:   { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400", label: "Ready for Pickup" },
  WAITING_FOR_DRIVER: { bg: "bg-amber-50",   text: "text-amber-600",   dot: "bg-amber-400",   label: "Finding Driver" },
  PICKED_UP:          { bg: "bg-blue-50",    text: "text-blue-600",    dot: "bg-blue-400",    label: "Picked Up" },
  ON_THE_WAY:         { bg: "bg-primary/10", text: "text-primary",     dot: "bg-primary",     label: "On the way" },
  DELIVERED:          { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400", label: "Delivered" },
  CANCELLED:          { bg: "bg-slate-100",  text: "text-slate-500",   dot: "bg-slate-400",   label: "Cancelled" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <View className={`px-2 py-0.5 rounded-md ${cfg.bg} mb-1`}>
      <Text className={`text-[10px] font-semibold ${cfg.text}`}>{cfg.label}</Text>
    </View>
  );
}

export function StatusBanner({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <View className={`${cfg.bg} border-b border-border/20 px-4 py-2.5 flex-row items-center`}>
      <View className={`w-2 h-2 rounded-full ${cfg.dot} mr-2`} />
      <Text className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</Text>
    </View>
  );
}
