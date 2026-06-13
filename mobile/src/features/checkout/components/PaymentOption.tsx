import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@src/constants/theme";

type IconName = keyof typeof Ionicons.glyphMap;

const METHOD_ICONS: Record<string, IconName> = {
  CASH: "cash-outline",
  CARD: "card-outline",
  PAYPAL: "logo-paypal",
};

interface PaymentOptionProps {
  method: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function PaymentOption({ method, isSelected, onSelect }: PaymentOptionProps) {
  const icon = METHOD_ICONS[method.name] || "wallet-outline";

  return (
    <TouchableOpacity
      className={`flex-row items-center bg-white p-4 rounded-xl border ${
        isSelected ? "border-primary bg-primary/5" : "border-border/40"
      }`}
      onPress={() => onSelect(method.id)}
      activeOpacity={0.8}
    >
      <View
        className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
          isSelected ? "border-primary bg-primary" : "border-border/60"
        }`}
      >
        {isSelected && <View className="w-2 h-2 rounded-full bg-white" />}
      </View>
      <View className="w-9 h-9 rounded-full bg-[#F5F5F5] items-center justify-center mr-3">
        <Ionicons
          name={icon}
          size={18}
          color={isSelected ? COLORS.primary : COLORS.textSecondary}
        />
      </View>
      <Text
        className={`text-sm font-semibold ${
          isSelected ? "text-primary" : "text-textPrimary"
        }`}
      >
        {method.name}
      </Text>
    </TouchableOpacity>
  );
}
