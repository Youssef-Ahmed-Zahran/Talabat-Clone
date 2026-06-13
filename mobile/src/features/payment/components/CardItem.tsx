import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SavedCard } from "../api/payment.api";
import { COLORS } from "@src/constants/theme";

const BRAND_COLORS: Record<string, string> = {
  VISA: "#1A1F71",
  MASTERCARD: "#EB001B",
  AMEX: "#007BC1",
};

export function CardItem({
  card,
  onDelete,
  onSetDefault,
  isDeleting,
  isSettingDefault,
}: {
  card: SavedCard;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  isDeleting: boolean;
  isSettingDefault: boolean;
}) {
  const brandColor = BRAND_COLORS[card.brand.toUpperCase()] ?? "#6B7280";

  return (
    <View
      className={`bg-white rounded-xl p-4 mb-3 border ${
        card.isDefault ? "border-primary/30 bg-primary/[0.02]" : "border-border/40"
      }`}
    >
      <View className="flex-row items-center mb-3">
        <View
          className="w-10 h-10 rounded-lg items-center justify-center mr-3"
          style={{ backgroundColor: brandColor + "18" }}
        >
          <Ionicons name="card-outline" size={20} color={brandColor} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-textPrimary capitalize">{card.brand}</Text>
          <Text className="text-xs text-textTertiary">•••• •••• •••• {card.lastFour}</Text>
        </View>
        {card.isDefault && (
          <View className="bg-primary/10 px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-semibold text-primary">Default</Text>
          </View>
        )}
      </View>

      <Text className="text-xs text-textTertiary mb-4">
        Expires {String(card.expiryMonth).padStart(2, "0")}/{card.expiryYear}
      </Text>

      <View className="flex-row gap-x-2">
        {!card.isDefault && (
          <TouchableOpacity
            className="flex-1 h-9 rounded-lg bg-primary/10 items-center justify-center"
            onPress={() => onSetDefault(card.id)}
            disabled={isSettingDefault}
            activeOpacity={0.8}
          >
            {isSettingDefault ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text className="text-xs font-semibold text-primary">Set as Default</Text>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          className="flex-1 h-9 rounded-lg bg-red-50 items-center justify-center"
          onPress={() => onDelete(card.id)}
          disabled={isDeleting}
          activeOpacity={0.8}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={COLORS.error} />
          ) : (
            <Text className="text-xs font-semibold text-error">Remove</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
