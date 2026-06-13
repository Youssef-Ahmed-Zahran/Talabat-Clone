import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@src/constants/theme";

type IconName = keyof typeof Ionicons.glyphMap;

interface AccountMenuItemProps {
  icon: IconName;
  label: string;
  route: string | null;
  onPress: (route: string) => void;
  showBorder: boolean;
}

export function AccountMenuItem({
  icon,
  label,
  route,
  onPress,
  showBorder,
}: AccountMenuItemProps) {
  return (
    <TouchableOpacity
      className={`flex-row items-center px-5 py-4 ${showBorder ? "border-b border-border/40" : ""}`}
      onPress={() => route && onPress(route)}
      activeOpacity={0.7}
    >
      <View className="w-10 h-10 rounded-full bg-[#F5F5F5] items-center justify-center mr-4">
        <Ionicons name={icon} size={20} color={COLORS.textPrimary} />
      </View>
      <Text className="flex-1 text-base font-medium text-textPrimary">{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );
}
