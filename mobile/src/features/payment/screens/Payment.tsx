import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Loader } from "@src/components/loader/Loader";
import { usePayment } from "../hooks/usePayment";
import { CardItem } from "../components/CardItem";
import { AddCardModal } from "../components/AddCardModal";
import { COLORS } from "@src/constants/theme";

export default function PaymentScreen() {
  const { query, state, actions } = usePayment();

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]" edges={["top"]}>
      <StatusBar style="dark" />

      <View className="px-4 py-4 bg-white border-b border-border/40">
        <Text className="text-xl font-bold text-textPrimary">talabat Pay</Text>
        <Text className="text-sm text-textTertiary mt-0.5">
          Manage your wallet & cards
        </Text>
      </View>

      {query.isLoading ? (
        <Loader message="Loading payment info..." />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Wallet Card */}
          <View className="bg-primary rounded-2xl p-6 mb-6 relative overflow-hidden">
            <View className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
            <View className="mb-6">
              <Text className="text-3xl font-bold text-white">0.00 EGP</Text>
              <Text className="text-xs font-medium text-white/70 mt-1">
                Available Balance
              </Text>
            </View>
            <TouchableOpacity
              className="bg-white h-11 rounded-xl items-center justify-center flex-row"
              activeOpacity={0.9}
            >
              <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
              <Text className="text-sm font-bold text-primary ml-1.5">
                Add Credits
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-textPrimary">Saved Cards</Text>
            <Text className="text-sm text-textTertiary">
              {(query.cards ?? []).length} card
              {(query.cards ?? []).length !== 1 ? "s" : ""}
            </Text>
          </View>

          {(query.cards ?? []).length > 0 ? (
            (query.cards ?? []).map((card) => (
              <CardItem
                key={card.id}
                card={card}
                onDelete={actions.handleDelete}
                onSetDefault={actions.handleSetDefault}
                isDeleting={state.deletingId === card.id}
                isSettingDefault={state.settingDefaultId === card.id}
              />
            ))
          ) : (
            <View className="items-center py-10 bg-white rounded-xl border border-border/40">
              <Ionicons name="card-outline" size={40} color={COLORS.textTertiary} />
              <Text className="text-sm font-semibold text-textSecondary mt-3">
                No saved cards yet
              </Text>
              <Text className="text-xs text-textTertiary mt-1 text-center px-6">
                Add a card to speed up checkout
              </Text>
            </View>
          )}

          <TouchableOpacity
            className="mt-4 flex-row items-center justify-center bg-white h-14 rounded-xl border border-dashed border-border"
            onPress={actions.openModal}
            activeOpacity={0.8}
          >
            <Ionicons name="add-outline" size={20} color={COLORS.textPrimary} />
            <Text className="text-sm font-semibold text-textPrimary ml-2">
              Add New Card
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <AddCardModal visible={state.showModal} onClose={actions.closeModal} />
    </SafeAreaView>
  );
}
