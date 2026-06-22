import React from "react";
import { View, Text, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@src/constants/theme";
import { AuthFormInputProps } from "../types/auth.types";

export function AuthFormInput({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  secureTextEntry,
  rightElement,
}: AuthFormInputProps) {
  return (
    <View className="gap-y-1.5">
      <Text className="text-sm font-medium text-textPrimary ml-1">{label}</Text>
      <View className="flex-row items-center bg-[#F5F5F5] rounded-xl px-4 h-12">
        <Ionicons name={icon} size={20} color={COLORS.textTertiary} />
        <TextInput
          className="flex-1 text-base text-textPrimary h-full ml-3"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textTertiary}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          secureTextEntry={secureTextEntry}
        />
        {rightElement}
      </View>
    </View>
  );
}
