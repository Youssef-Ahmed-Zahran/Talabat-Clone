import React from "react";
import { View, Text, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@src/constants/theme";

// ─── Field wrapper with label + icon ─────────────────────────────────────────
export function InputField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  return (
    <View>
      <View className="flex-row items-center mb-2 ml-1 gap-x-1.5">
        <Ionicons name={icon} size={12} color={COLORS.textTertiary} />
        <Text className="text-[10px] font-black text-textTertiary uppercase tracking-widest">
          {label}
        </Text>
      </View>
      {children}
    </View>
  );
}

// ─── Styled text input ────────────────────────────────────────────────────────
export function StyledInput(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      className="bg-white px-4 py-4 rounded-2xl text-base text-textPrimary border border-border/60 font-medium"
      placeholderTextColor="#C4C9D4"
      {...props}
    />
  );
}
