import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAddCardForm } from "../hooks/useAddCardForm";

export function AddCardModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { state, actions } = useAddCardForm(onClose);

  const brands = ["VISA", "MASTERCARD", "AMEX"];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <TouchableOpacity
          className="flex-1 bg-black/40"
          activeOpacity={1}
          onPress={onClose}
        />
        <View className="bg-white rounded-t-[40px] px-8 pt-6 pb-12">
          {/* Handle */}
          <View className="w-12 h-1.5 rounded-full bg-border/60 self-center mb-6" />

          <Text className="text-2xl font-black text-textPrimary mb-8">
            Add New Card
          </Text>

          {/* Card Brand */}
          <Text className="text-sm font-black text-textSecondary uppercase tracking-widest mb-3">
            Card Brand
          </Text>
          <View className="flex-row gap-x-3 mb-6">
            {brands.map((b) => (
              <TouchableOpacity
                key={b}
                onPress={() => state.setForm((f) => ({ ...f, brand: b }))}
                className={`flex-1 h-12 rounded-2xl items-center justify-center border ${
                  state.form.brand === b
                    ? "bg-primary border-primary"
                    : "bg-surfaceAlt border-border/40"
                }`}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-xs font-black ${state.form.brand === b ? "text-white" : "text-textSecondary"}`}
                >
                  {b}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Last Four */}
          <Text className="text-sm font-black text-textSecondary uppercase tracking-widest mb-3">
            Last 4 Digits
          </Text>
          <TextInput
            className="bg-surfaceAlt rounded-2xl px-5 h-14 text-base font-bold text-textPrimary border border-border/40 mb-6"
            placeholder="e.g. 4242"
            keyboardType="numeric"
            maxLength={4}
            value={state.form.lastFour}
            onChangeText={(v) =>
              state.setForm((f) => ({ ...f, lastFour: v.replace(/\D/g, "") }))
            }
          />

          {/* Expiry */}
          <Text className="text-sm font-black text-textSecondary uppercase tracking-widest mb-3">
            Expiry Date
          </Text>
          <TextInput
            className="bg-surfaceAlt rounded-2xl px-5 h-14 text-base font-bold text-textPrimary border border-border/40 mb-6"
            placeholder="MM/YY"
            keyboardType="numeric"
            maxLength={5}
            value={state.expiry}
            onChangeText={actions.handleExpiryChange}
          />

          {/* Default toggle */}
          <TouchableOpacity
            className="flex-row items-center mb-8"
            onPress={() =>
              state.setForm((f) => ({ ...f, isDefault: !f.isDefault }))
            }
            activeOpacity={0.8}
          >
            <View
              className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                state.form.isDefault
                  ? "border-primary bg-primary"
                  : "border-border/60"
              }`}
            >
              {state.form.isDefault && (
                <View className="w-2.5 h-2.5 rounded-full bg-white" />
              )}
            </View>
            <Text className="text-base font-bold text-textPrimary">
              Set as default card
            </Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            className={`h-16 rounded-2xl items-center justify-center shadow-xl ${
              actions.isPending
                ? "bg-slate-200"
                : "bg-primary shadow-primary/30"
            }`}
            onPress={actions.handleSubmit}
            disabled={actions.isPending}
            activeOpacity={0.9}
          >
            {actions.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-black text-white">Save Card</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
