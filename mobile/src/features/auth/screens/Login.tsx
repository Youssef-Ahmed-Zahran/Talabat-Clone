import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useLoginScreen } from "../hooks/useLogin";
import { AuthFormInput } from "../components/AuthFormInput";
import { TalabatLogo } from "@src/components/ui/TalabatLogo";
import { COLORS } from "@src/constants/theme";

export default function LoginScreen() {
  const { form, state, actions, router } = useLoginScreen();

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-6 pt-16 pb-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center mb-10">
          <TalabatLogo size="lg" />
          <Text className="text-2xl font-bold text-textPrimary mt-8 mb-1">
            Welcome back!
          </Text>
          <Text className="text-base text-textSecondary text-center">
            Sign in to continue ordering
          </Text>
        </View>

        {/* Form */}
        <View className="gap-y-4">
          <AuthFormInput
            label="Email Address"
            icon="mail-outline"
            value={form.email}
            onChangeText={form.setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View>
            <AuthFormInput
              label="Password"
              icon="lock-closed-outline"
              value={form.password}
              onChangeText={form.setPassword}
              placeholder="Enter your password"
              secureTextEntry={!state.showPassword}
              rightElement={
                <TouchableOpacity onPress={state.toggleShowPassword}>
                  <Ionicons
                    name={state.showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={COLORS.textTertiary}
                  />
                </TouchableOpacity>
              }
            />
            <TouchableOpacity className="items-end mt-1">
              <Text className="text-primary font-semibold text-sm">
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className={`bg-primary h-12 rounded-xl justify-center items-center mt-2 ${state.isPending ? "opacity-70" : "opacity-100"}`}
            onPress={actions.handleLogin}
            disabled={state.isPending}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-bold">
              {state.isPending ? "Signing in..." : "Sign In"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-8">
          <View className="flex-1 h-px bg-border" />
          <Text className="mx-4 text-textTertiary text-sm">or continue with</Text>
          <View className="flex-1 h-px bg-border" />
        </View>

        {/* Social Login */}
        <View className="flex-row justify-center gap-x-4">
          <TouchableOpacity className="w-14 h-14 rounded-xl border border-border items-center justify-center bg-white">
            <Text className="text-xl font-bold text-textPrimary">G</Text>
          </TouchableOpacity>
          <TouchableOpacity className="w-14 h-14 rounded-xl border border-border items-center justify-center bg-white">
            <Ionicons name="logo-apple" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity className="w-14 h-14 rounded-xl border border-border items-center justify-center bg-white">
            <Ionicons name="logo-facebook" size={24} color="#1877F2" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="flex-row justify-center items-center mt-10 pb-6">
          <Text className="text-textSecondary">Don&apos;t have an account? </Text>
          <TouchableOpacity onPress={router.navigateToRegister}>
            <Text className="text-primary font-bold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
