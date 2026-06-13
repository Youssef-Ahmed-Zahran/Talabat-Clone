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
import { useRegisterScreen } from "../hooks/useRegister";
import { AuthFormInput } from "../components/AuthFormInput";
import { TalabatLogo } from "@src/components/ui/TalabatLogo";
import { COLORS } from "@src/constants/theme";

export default function RegisterScreen() {
  const { form, state, actions, router } = useRegisterScreen();

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-6 pt-12 pb-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-8">
          <TalabatLogo size="lg" />
          <Text className="text-2xl font-bold text-textPrimary mt-6 mb-1">
            Create Account
          </Text>
          <Text className="text-base text-textSecondary">
            Join and start ordering
          </Text>
        </View>

        <View className="gap-y-4">
          <AuthFormInput
            label="Full Name *"
            icon="person-outline"
            value={form.fullName}
            onChangeText={form.setFullName}
            placeholder="John Doe"
            autoCapitalize="words"
          />

          <AuthFormInput
            label="Email *"
            icon="mail-outline"
            value={form.email}
            onChangeText={form.setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <AuthFormInput
            label="Phone (optional)"
            icon="call-outline"
            value={form.phone}
            onChangeText={form.setPhone}
            placeholder="+20 123 456 7890"
            keyboardType="phone-pad"
          />

          <AuthFormInput
            label="Password *"
            icon="lock-closed-outline"
            value={form.password}
            onChangeText={form.setPassword}
            placeholder="Min 6 characters"
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

          <AuthFormInput
            label="Confirm Password *"
            icon="lock-closed-outline"
            value={form.confirmPassword}
            onChangeText={form.setConfirmPassword}
            placeholder="Re-enter password"
            secureTextEntry={!state.showPassword}
          />

          <TouchableOpacity
            className={`bg-primary h-12 rounded-xl justify-center items-center mt-2 ${state.isPending ? "opacity-70" : "opacity-100"}`}
            onPress={actions.handleRegister}
            disabled={state.isPending}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-bold">
              {state.isPending ? "Creating account..." : "Create Account"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center items-center mt-8 pb-6">
          <Text className="text-textSecondary">Already have an account? </Text>
          <TouchableOpacity onPress={router.navigateToLogin}>
            <Text className="text-primary font-bold">Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
