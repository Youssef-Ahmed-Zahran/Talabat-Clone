import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useLogin } from "@features/auth/hooks/useLogin";
import { AuthFormInput } from "@features/auth/components/AuthFormInput";
import { COLORS } from "@constants/theme";

export default function LoginScreen() {
  const {
    actions: { onSubmit, isPending },
    state: { form },
  } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    control,
    formState: { errors },
  } = form;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 py-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mb-10 items-center">
            <View className="w-20 h-20 rounded-2xl bg-primary items-center justify-center mb-6">
              <Ionicons name="car" size={40} color={COLORS.white} />
            </View>
            <Text className="text-3xl font-bold text-textPrimary mb-2">
              Driver Portal
            </Text>
            <Text className="text-base text-textSecondary text-center">
              Sign in to start accepting deliveries
            </Text>
          </View>

          {/* Form */}
          <View className="mb-6">
            <AuthFormInput
              control={control}
              name="email"
              label="Email Address"
              placeholder="driver@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email?.message}
            />

            <AuthFormInput
              control={control}
              name="password"
              label="Password"
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              error={errors.password?.message}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              }
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            className="bg-primary rounded-xl h-14 items-center justify-center"
            onPress={onSubmit}
            disabled={isPending}
            activeOpacity={0.85}
          >
            {isPending ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text className="text-white font-semibold text-base">
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Register link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-textSecondary text-sm">New driver? </Text>
            <TouchableOpacity onPress={() => router.push("/auth/register")}>
              <Text className="text-primary font-semibold text-sm">
                Create Account
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
