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
import { useRegister } from "@features/auth/hooks/useRegister";
import { AuthFormInput } from "@features/auth/components/AuthFormInput";
import { COLORS } from "@constants/theme";

export default function RegisterScreen() {
  const {
    state: { form },
    actions: { onSubmit, isPending },
  } = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
          contentContainerClassName="px-6 py-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-6 self-start p-1"
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          {/* Header */}
          <View className="mb-8">
            <View className="w-16 h-16 rounded-2xl bg-primary items-center justify-center mb-5">
              <Ionicons name="person-add" size={30} color={COLORS.white} />
            </View>
            <Text className="text-3xl font-bold text-textPrimary mb-1">
              Create Account
            </Text>
            <Text className="text-base text-textSecondary">
              Join as a delivery driver
            </Text>
          </View>

          {/* Account Section */}
          <Text className="text-xs font-semibold text-textTertiary uppercase tracking-widest mb-3">
            Account
          </Text>

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
            placeholder="Min. 6 characters"
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

          <AuthFormInput
            control={control}
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Repeat your password"
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
            error={errors.confirmPassword?.message}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirm((p) => !p)}>
                <Ionicons
                  name={showConfirm ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            }
          />

          {/* Location Section */}
          <Text className="text-xs font-semibold text-textTertiary uppercase tracking-widest mb-3 mt-4">
            Location
          </Text>

          <AuthFormInput
            control={control}
            name="countryName"
            label="Country"
            placeholder="e.g. Egypt"
            error={errors.countryName?.message}
          />

          <AuthFormInput
            control={control}
            name="countryCode"
            label="Country Code"
            placeholder="e.g. EG"
            autoCapitalize="characters"
            error={errors.countryCode?.message}
          />

          <AuthFormInput
            control={control}
            name="governorateName"
            label="Governorate / State (optional)"
            placeholder="e.g. Cairo"
            error={errors.governorateName?.message}
          />

          <AuthFormInput
            control={control}
            name="cityName"
            label="City"
            placeholder="e.g. New Cairo"
            error={errors.cityName?.message}
          />

          {/* Submit */}
          <TouchableOpacity
            className="bg-primary rounded-xl h-14 items-center justify-center mt-6"
            onPress={onSubmit}
            disabled={isPending}
            activeOpacity={0.85}
          >
            {isPending ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text className="text-white font-semibold text-base">
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign In link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-textSecondary text-sm">
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <Text className="text-primary font-semibold text-sm">
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
