import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@constants/theme";
import type { DebtPaymentMethod } from "../types/wallet.types";

interface MethodCard {
  method: DebtPaymentMethod;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
  badge?: string;
}

const METHODS: MethodCard[] = [
  {
    method: "CREDIT_CARD",
    label: "Credit Card",
    subtitle: "Instant confirmation",
    icon: "card",
    color: COLORS.primary,
    badge: "Instant",
  },
  {
    method: "VODAFONE_CASH",
    label: "Vodafone Cash",
    subtitle: "Send to 01001234567 • Admin confirms",
    icon: "phone-portrait",
    color: "#E60000",
  },
  {
    method: "INSTAPAY",
    label: "InstaPay",
    subtitle: "Transfer to talabat@instapay • Admin confirms",
    icon: "flash",
    color: "#7C3AED",
  },
];

interface Props {
  selected: DebtPaymentMethod | null;
  onSelect: (method: DebtPaymentMethod) => void;
}

export function PaymentMethodSelector({ selected, onSelect }: Props) {
  return (
    <View className="gap-3">
      {METHODS.map((m) => {
        const isSelected = selected === m.method;
        return (
          <TouchableOpacity
            key={m.method}
            onPress={() => onSelect(m.method)}
            activeOpacity={0.8}
            className="flex-row items-center p-4 rounded-2xl border-2"
            style={{
              borderColor: isSelected ? m.color : "#E8E8E8",
              backgroundColor: isSelected ? `${m.color}10` : "#FFFFFF",
            }}
          >
            {/* Icon */}
            <View
              className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
              style={{ backgroundColor: `${m.color}18` }}
            >
              <Ionicons name={m.icon as any} size={22} color={m.color} />
            </View>

            {/* Text */}
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-textPrimary font-bold text-base">
                  {m.label}
                </Text>
                {m.badge && (
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${m.color}20` }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{ color: m.color }}
                    >
                      {m.badge}
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-textSecondary text-sm mt-0.5">
                {m.subtitle}
              </Text>
            </View>

            {/* Radio */}
            <View
              className="w-5 h-5 rounded-full border-2 items-center justify-center"
              style={{ borderColor: isSelected ? m.color : "#D1D5DB" }}
            >
              {isSelected && (
                <View
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: m.color }}
                />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
