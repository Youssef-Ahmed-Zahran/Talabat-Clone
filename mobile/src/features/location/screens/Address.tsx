import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAddress } from "../hooks/useAddress";
import type { AddressType } from "@src/features/location/types/address.types";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "@src/constants/theme";

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
  const { form, query, state, actions, router } = useAddress();

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]" edges={["top"]}>
      <StatusBar style="dark" />
      <View className="flex-row items-center px-4 py-4 bg-white border-b border-border/40">
        <TouchableOpacity onPress={router.navigateBack} className="mr-3">
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-textPrimary">
            Address Details
          </Text>
          <Text className="text-xs text-textTertiary mt-0.5">Step 2 of 2</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-lg font-bold text-textPrimary mb-1">
          Almost there!
        </Text>
        <Text className="text-sm text-textSecondary mb-6">
          Provide your building details for delivery.
        </Text>

        {/* City Selection */}
        <View className="mb-8">
          <Text className="text-xs font-black text-textTertiary uppercase tracking-widest mb-2 ml-1">
            City *
          </Text>
          <TextInput
            className="bg-surfaceAlt px-6 py-4 rounded-2xl text-base text-textPrimary border border-border/40 font-bold"
            value={form.cityName}
            onChangeText={form.setCityName}
            placeholder="e.g. Cairo"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Address Type */}
        <View className="mb-8">
          <Text className="text-xs font-black text-textTertiary uppercase tracking-widest mb-3 ml-1">
            Place Type
          </Text>
          <View className="flex-row gap-x-3">
            {ADDRESS_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                className={`flex-1 flex-row items-center justify-center py-4 rounded-2xl border ${
                  form.type === t.value
                    ? "bg-primary border-primary"
                    : "bg-surfaceAlt border-border/40"
                }`}
                onPress={() => form.setType(t.value)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={t.icon}
                  size={18}
                  color={
                    form.type === t.value ? COLORS.white : COLORS.textSecondary
                  }
                  style={{ marginRight: 6 }}
                />
                <Text
                  className={`text-sm font-semibold ${form.type === t.value ? "text-white" : "text-textSecondary"}`}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fields */}
        <View className="gap-y-6">
          <View>
            <Text className="text-xs font-black text-textTertiary uppercase tracking-widest mb-2 ml-1">
              Address Label
            </Text>
            <TextInput
              className="bg-surfaceAlt px-6 py-4 rounded-2xl text-base text-textPrimary border border-border/40"
              value={form.label}
              onChangeText={form.setLabel}
              placeholder="e.g. Home, Work, Parents"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View>
            <Text className="text-xs font-black text-textTertiary uppercase tracking-widest mb-2 ml-1">
              Building Details
            </Text>
            <TextInput
              className="bg-surfaceAlt px-6 py-4 rounded-2xl text-base text-textPrimary border border-border/40"
              value={form.buildingName}
              onChangeText={form.setBuildingName}
              placeholder="Building name or number"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <Text className="text-[10px] font-black text-textTertiary uppercase tracking-widest mb-2 ml-1">
                Apartment #
              </Text>
              <TextInput
                className="bg-surfaceAlt px-6 py-4 rounded-2xl text-base text-textPrimary border border-border/40"
                value={form.apartmentNumber}
                onChangeText={form.setApartmentNumber}
                placeholder="12"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-black text-textTertiary uppercase tracking-widest mb-2 ml-1">
                Floor
              </Text>
              <TextInput
                className="bg-surfaceAlt px-6 py-4 rounded-2xl text-base text-textPrimary border border-border/40"
                value={form.floor}
                onChangeText={form.setFloor}
                placeholder="3"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View>
            <Text className="text-xs font-black text-textTertiary uppercase tracking-widest mb-2 ml-1">
              Street Name
            </Text>
            <TextInput
              className="bg-surfaceAlt px-6 py-4 rounded-2xl text-base text-textPrimary border border-border/40"
              value={form.street}
              onChangeText={form.setStreet}
              placeholder="Enter your street"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View>
            <Text className="text-xs font-black text-textTertiary uppercase tracking-widest mb-2 ml-1">
              Contact Number
            </Text>
            <TextInput
              className="bg-surfaceAlt px-6 py-4 rounded-2xl text-base text-textPrimary border border-border/40"
              value={form.phone}
              onChangeText={form.setPhone}
              placeholder="+20 123 456 7890"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            className={`h-16 rounded-2xl justify-center items-center shadow-xl mt-4 ${
              state.isPending ? "bg-slate-200" : "bg-primary shadow-primary/30"
            }`}
            onPress={actions.handleSave}
            disabled={state.isPending}
            activeOpacity={0.9}
          >
            <Text
              className={`text-xl font-black ${state.isPending ? "text-slate-400" : "text-white"}`}
            >
              {state.isPending ? "Saving..." : "Confirm Address"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
