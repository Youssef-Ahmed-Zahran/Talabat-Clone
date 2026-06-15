import React from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";
import { Controller, Control, FieldValues, Path } from "react-hook-form";

interface AuthFormInputProps<T extends FieldValues> extends TextInputProps {
  control: Control<T>;
  name: Path<T>;
  label: string;
  error?: string;
  rightIcon?: React.ReactNode;
}

export function AuthFormInput<T extends FieldValues>({
  control,
  name,
  label,
  error,
  rightIcon,
  ...inputProps
}: AuthFormInputProps<T>) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-textSecondary mb-1.5">
        {label}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <View
            className={`flex-row items-center bg-surfaceAlt border rounded-xl px-4 h-14 ${
              error ? "border-danger" : "border-border"
            }`}
          >
            <TextInput
              className="flex-1 text-base text-textPrimary"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholderTextColor="#9CA3AF"
              {...inputProps}
            />
            {rightIcon && <View className="ml-2">{rightIcon}</View>}
          </View>
        )}
      />
      {error ? (
        <Text className="text-danger text-xs mt-1 ml-1">{error}</Text>
      ) : null}
    </View>
  );
}
