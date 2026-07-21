import { SafeAreaView } from "react-native-safe-area-context";
import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAddress } from "../hooks/useAddress";
import type { AddressType } from "@src/features/location/types/address.types";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "@src/constants/theme";
import { InputField, StyledInput } from "../components/AddressFormFields";

const ADDRESS_TYPES: {
  value: AddressType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: "APARTMENT", label: "Apartment", icon: "business-outline" },
  { value: "VILLA", label: "Villa", icon: "home-outline" },
  { value: "OFFICE", label: "Office", icon: "briefcase-outline" },
];

export default function AddressScreen() {
  const { form, state, actions, router } = useAddress();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();

  const onPressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

  return (
    <SafeAreaView className="flex-1 bg-[#F4F5F8]" edges={["top"]}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View className="bg-white border-b border-border/40">
        {/* Nav row */}
        <View className="flex-row items-center px-4 pt-3 pb-2">
          <TouchableOpacity
            onPress={router.navigateBack}
            className="w-9 h-9 rounded-full bg-[#F4F5F8] items-center justify-center mr-3"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View className="flex-1">
            <Text className="text-lg font-bold text-textPrimary">
              Address Details
            </Text>
            <Text className="text-xs text-textTertiary">Step 2 of 2</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View className="h-1 bg-[#F0F0F0] mx-4 mb-3 rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{ width: "100%", backgroundColor: COLORS.primary }}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero callout ── */}
        <View className="flex-row items-start bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-7 gap-x-3">
          <View
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: COLORS.primary + "20" }}
          >
            <Ionicons
              name="location-outline"
              size={18}
              color={COLORS.primary}
            />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-textPrimary">
              Almost there!
            </Text>
            <Text className="text-sm text-textSecondary mt-0.5 leading-5">
              Provide your building details so we can deliver right to your
              door.
            </Text>
          </View>
        </View>

        {/* ── City ── */}
        <View className="mb-6">
          <InputField label="City *" icon="map-outline">
            <StyledInput
              value={form.cityName}
              onChangeText={form.setCityName}
              placeholder="e.g. Cairo"
            />
          </InputField>
        </View>

        {/* ── Place Type ── */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3 ml-1 gap-x-1.5">
            <Ionicons
              name="apps-outline"
              size={12}
              color={COLORS.textTertiary}
            />
            <Text className="text-[10px] font-black text-textTertiary uppercase tracking-widest">
              Place Type
            </Text>
          </View>
          <View className="flex-row gap-x-3">
            {ADDRESS_TYPES.map((t) => {
              const isActive = form.type === t.value;
              return (
                <TouchableOpacity
                  key={t.value}
                  className={`flex-1 flex-col items-center justify-center py-4 rounded-2xl border ${
                    isActive
                      ? "bg-primary border-primary"
                      : "bg-white border-border/60"
                  }`}
                  onPress={() => form.setType(t.value)}
                  activeOpacity={0.8}
                >
                  <View
                    className={`w-9 h-9 rounded-full items-center justify-center mb-2 ${
                      isActive ? "bg-white/20" : "bg-[#F4F5F8]"
                    }`}
                  >
                    <Ionicons
                      name={t.icon}
                      size={18}
                      color={isActive ? COLORS.white : COLORS.textSecondary}
                    />
                  </View>
                  <Text
                    className={`text-xs font-bold ${
                      isActive ? "text-white" : "text-textSecondary"
                    }`}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Divider ── */}
        <View className="h-px bg-border/40 mb-6" />

        {/* ── Fields ── */}
        <View className="gap-y-5">
          {/* Address Label */}
          <InputField label="Address Label" icon="pricetag-outline">
            <StyledInput
              value={form.label}
              onChangeText={form.setLabel}
              placeholder="e.g. Home, Work, Parents"
            />
          </InputField>

          {/* Building Details */}
          <InputField label="Building Details" icon="business-outline">
            <StyledInput
              value={form.buildingName}
              onChangeText={form.setBuildingName}
              placeholder="Building name or number"
            />
          </InputField>

          {/* Apartment # & Floor side-by-side */}
          <View className="flex-row gap-x-3">
            <View className="flex-1">
              <InputField label="Apartment #" icon="keypad-outline">
                <StyledInput
                  value={form.apartmentNumber}
                  onChangeText={form.setApartmentNumber}
                  placeholder="12"
                  keyboardType="numeric"
                />
              </InputField>
            </View>
            <View className="flex-1">
              <InputField label="Floor" icon="layers-outline">
                <StyledInput
                  value={form.floor}
                  onChangeText={form.setFloor}
                  placeholder="3"
                  keyboardType="numeric"
                />
              </InputField>
            </View>
          </View>

          {/* Street Name */}
          <InputField label="Street Name" icon="navigate-outline">
            <StyledInput
              value={form.street}
              onChangeText={form.setStreet}
              placeholder="Enter your street"
            />
          </InputField>

          {/* Contact Number */}
          <InputField label="Contact Number" icon="call-outline">
            <StyledInput
              value={form.phone}
              onChangeText={form.setPhone}
              placeholder="+20 123 456 7890"
              keyboardType="phone-pad"
            />
          </InputField>
        </View>

        {/* ── Delivery note ── */}
        <View className="flex-row items-center mt-6 gap-x-2 bg-white rounded-xl px-4 py-3 border border-border/50">
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={COLORS.textTertiary}
          />
          <Text className="text-xs text-textTertiary flex-1 leading-4">
            Your address is saved securely and only used for delivery purposes.
          </Text>
        </View>

        {/* ── CTA Button ── */}
        <Animated.View
          style={{ transform: [{ scale: scaleAnim }], marginTop: 20 }}
        >
          <TouchableOpacity
            style={{
              height: 58,
              borderRadius: 18,
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "row",
              gap: 8,
              backgroundColor: state.isPending ? "#E0E0E0" : COLORS.primary,
              shadowColor: COLORS.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: state.isPending ? 0 : 0.35,
              shadowRadius: 12,
              elevation: state.isPending ? 0 : 6,
            }}
            onPress={actions.handleSave}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={state.isPending}
            activeOpacity={1}
          >
            {state.isPending ? (
              <>
                <ActivityIndicator size="small" color="#94A3B8" />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: "#94A3B8",
                  }}
                >
                  Saving...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={COLORS.white}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: COLORS.white,
                    letterSpacing: 0.3,
                  }}
                >
                  Confirm Address
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
