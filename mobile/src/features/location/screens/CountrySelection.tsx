import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCountrySelection } from "../hooks/useCountrySelection";
import { TalabatLogo } from "@src/components/ui/TalabatLogo";
import { COLORS } from "@src/constants/theme";
import type { Country } from "@src/features/location/types/geography.types";

const FLAG: Record<string, string> = {
  EG: "🇪🇬",
  SA: "🇸🇦",
  AE: "🇦🇪",
  KW: "🇰🇼",
  QA: "🇶🇦",
  BH: "🇧🇭",
  JO: "🇯🇴",
  LB: "🇱🇧",
  IQ: "🇮🇶",
  OM: "🇴🇲",
};

export default function CountrySelectionScreen() {
  const router = useRouter();
  const { query, actions } = useCountrySelection();

  const renderCountry = ({ item }: { item: Country }) => (
    <TouchableOpacity
      className="flex-row items-center bg-white p-4 rounded-xl mb-3 border border-border/40"
      onPress={() => actions.handleSelectCountry(item)}
      activeOpacity={0.8}
    >
      <View className="w-12 h-12 rounded-full bg-[#F5F5F5] items-center justify-center mr-3">
        <Text className="text-2xl">{FLAG[item.code] ?? "🌍"}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-textPrimary">
          {item.name}
        </Text>
        <Text className="text-xs text-textTertiary mt-0.5">{item.code}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]" edges={["top"]}>
      <StatusBar style="dark" />
      {router.canGoBack() && (
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-12 left-4 z-20 w-10 h-10 bg-white rounded-full items-center justify-center border border-border/40"
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      )}
      <View className="items-center px-6 pt-8 pb-6">
        <TalabatLogo size="lg" />
        <Text className="text-xl font-bold text-textPrimary text-center mt-6 mb-1">
          Select Your Country
        </Text>
        <Text className="text-sm text-textSecondary text-center px-4">
          Choose your country to see restaurants and stores near you.
        </Text>
      </View>

      {query.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="text-sm text-textSecondary mt-3">
            Fetching countries...
          </Text>
        </View>
      ) : (
        <FlatList
          data={query.countries || []}
          keyExtractor={(item) => item.id ?? item.code}
          renderItem={renderCountry}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <Ionicons
                name="globe-outline"
                size={48}
                color={COLORS.textTertiary}
              />
              <Text className="text-base font-bold text-textPrimary mt-3">
                No countries found
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
