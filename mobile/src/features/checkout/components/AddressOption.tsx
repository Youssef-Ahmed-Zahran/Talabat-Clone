import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@src/constants/theme";

interface AddressOptionProps {
  address: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function AddressOption({ address, isSelected, onSelect }: AddressOptionProps) {
  return (
    <TouchableOpacity
      className={`flex-row items-center bg-white p-4 rounded-xl border ${
        isSelected ? "border-primary bg-primary/5" : "border-border/40"
      }`}
      onPress={() => onSelect(address.id)}
      activeOpacity={0.8}
    >
      <View
        className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
          isSelected ? "border-primary bg-primary" : "border-border/60"
        }`}
      >
        {isSelected && <View className="w-2 h-2 rounded-full bg-white" />}
      </View>
      <View className="flex-1">
        <Text
          className={`text-sm font-semibold ${
            isSelected ? "text-primary" : "text-textPrimary"
          }`}
        >
          {address.label || address.type}
        </Text>
        <Text className="text-xs text-textTertiary mt-0.5" numberOfLines={1}>
          {address.street}, {address.city?.name}
        </Text>
      </View>
      <Ionicons
        name="location-outline"
        size={18}
        color={isSelected ? COLORS.primary : COLORS.textTertiary}
      />
    </TouchableOpacity>
  );
}
