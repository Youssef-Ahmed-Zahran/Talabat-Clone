import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@constants/theme";
import { useWalletScreen } from "../hooks/useWalletScreen";
import { useRepayDebt } from "../hooks/useRepayDebt";
import { PaymentMethodSelector } from "../components/PaymentMethodSelector";
import type { DebtPaymentMethod } from "../types/wallet.types";

const TALABAT_NUMBERS = {
  VODAFONE_CASH: "01001234567",
  INSTAPAY: "talabat@instapay",
};

export default function RepayDebtScreen() {
  const router = useRouter();

  const { query: walletQuery } = useWalletScreen();
  const { debt, hasDebt } = walletQuery;

  const {
    query: { isSuccess, errorMessage },
    actions: { submit, reset, isPending: isLoading },
  } = useRepayDebt();

  const [selectedMethod, setSelectedMethod] =
    useState<DebtPaymentMethod | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [cardName, setCardName] = useState("");

  // ─── SUCCESS STATE ───────────────────────────────────────────
  if (isSuccess) {
    const isCreditCard = selectedMethod === "CREDIT_CARD";
    return (
      <SafeAreaView
        className="flex-1 bg-surfaceAlt items-center justify-center px-8"
        edges={["top", "bottom"]}
      >
        <View
          className="w-24 h-24 rounded-full items-center justify-center mb-6"
          style={{ backgroundColor: COLORS.successLight }}
        >
          <Ionicons name="checkmark-circle" size={52} color={COLORS.success} />
        </View>
        <Text className="text-2xl font-black text-textPrimary text-center mb-3">
          {isCreditCard ? "Payment Successful!" : "Request Submitted!"}
        </Text>
        <Text className="text-textSecondary text-center text-base leading-6 mb-8">
          {isCreditCard
            ? `Your debt of EGP ${debt.toFixed(2)} has been cleared. Your wallet is now updated.`
            : `Your payment request has been submitted. An admin will review your reference number and confirm within 24 hours.`}
        </Text>
        <TouchableOpacity
          onPress={() => {
            reset();
            router.back();
          }}
          className="w-full py-4 rounded-2xl items-center"
          style={{ backgroundColor: COLORS.primary }}
          activeOpacity={0.85}
        >
          <Text className="text-white font-black text-base">
            Back to Wallet
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── GUARD: no debt ──────────────────────────────────────────
  if (!hasDebt) {
    return (
      <SafeAreaView
        className="flex-1 bg-surfaceAlt items-center justify-center px-8"
        edges={["top"]}
      >
        <Ionicons
          name="checkmark-circle-outline"
          size={64}
          color={COLORS.success}
        />
        <Text className="text-xl font-black text-textPrimary mt-4">
          No Debt
        </Text>
        <Text className="text-textSecondary text-center mt-2">
          Your wallet balance is clear. No payment needed.
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-6">
          <Text className="text-primary font-bold">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const canSubmit = () => {
    if (!selectedMethod) return false;
    if (selectedMethod === "CREDIT_CARD") {
      return (
        cardNumber.length >= 16 &&
        cardExpiry.length >= 4 &&
        cardCVV.length >= 3 &&
        cardName.length > 2
      );
    }
    return referenceNumber.trim().length >= 4;
  };

  const handleSubmit = () => {
    if (!selectedMethod) return;

    Alert.alert(
      "Confirm Payment",
      `Pay EGP ${debt.toFixed(2)} via ${
        selectedMethod === "CREDIT_CARD"
          ? "Credit Card"
          : selectedMethod === "VODAFONE_CASH"
            ? "Vodafone Cash"
            : "InstaPay"
      }?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            submit({
              amount: debt,
              method: selectedMethod,
              referenceNumber: referenceNumber || undefined,
              note:
                selectedMethod === "CREDIT_CARD"
                  ? `Card ending in ${cardNumber.slice(-4)}`
                  : undefined,
            });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surfaceAlt" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-3 bg-surface border-b border-border flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-black text-textPrimary">
              Pay Debt
            </Text>
            <Text className="text-sm text-textSecondary">
              Clear your outstanding balance
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Amount Banner */}
          <View
            className="mx-4 mt-4 p-5 rounded-2xl items-center"
            style={{ backgroundColor: COLORS.danger }}
          >
            <Text className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">
              Amount to Pay
            </Text>
            <Text className="text-white font-black" style={{ fontSize: 40 }}>
              {debt.toFixed(2)}{" "}
              <Text style={{ fontSize: 20, opacity: 0.8 }}>EGP</Text>
            </Text>
            <Text className="text-white/60 text-sm mt-1">
              Your full outstanding debt
            </Text>
          </View>

          {/* Method Selection */}
          <View className="mx-4 mt-6">
            <Text className="text-xs font-black text-textTertiary uppercase tracking-widest mb-3">
              Choose Payment Method
            </Text>
            <PaymentMethodSelector
              selected={selectedMethod}
              onSelect={setSelectedMethod}
            />
          </View>

          {/* ── CREDIT CARD FIELDS ── */}
          {selectedMethod === "CREDIT_CARD" && (
            <View className="mx-4 mt-5 p-4 rounded-2xl bg-surface border border-border">
              <Text className="font-bold text-textPrimary mb-4">
                Card Details (Simulated)
              </Text>

              <View className="gap-3">
                <View>
                  <Text className="text-xs font-bold text-textSecondary mb-1.5 uppercase tracking-wide">
                    Cardholder Name
                  </Text>
                  <TextInput
                    value={cardName}
                    onChangeText={setCardName}
                    placeholder="Name on card"
                    className="border border-border rounded-xl px-4 py-3 text-textPrimary bg-surfaceAlt"
                    autoCapitalize="words"
                  />
                </View>
                <View>
                  <Text className="text-xs font-bold text-textSecondary mb-1.5 uppercase tracking-wide">
                    Card Number
                  </Text>
                  <TextInput
                    value={cardNumber}
                    onChangeText={(t) =>
                      setCardNumber(t.replace(/\D/g, "").slice(0, 16))
                    }
                    placeholder="0000 0000 0000 0000"
                    keyboardType="numeric"
                    className="border border-border rounded-xl px-4 py-3 text-textPrimary bg-surfaceAlt"
                  />
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-textSecondary mb-1.5 uppercase tracking-wide">
                      Expiry (MM/YY)
                    </Text>
                    <TextInput
                      value={cardExpiry}
                      onChangeText={(t) =>
                        setCardExpiry(t.replace(/\D/g, "").slice(0, 4))
                      }
                      placeholder="MM/YY"
                      keyboardType="numeric"
                      className="border border-border rounded-xl px-4 py-3 text-textPrimary bg-surfaceAlt"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-textSecondary mb-1.5 uppercase tracking-wide">
                      CVV
                    </Text>
                    <TextInput
                      value={cardCVV}
                      onChangeText={(t) =>
                        setCardCVV(t.replace(/\D/g, "").slice(0, 4))
                      }
                      placeholder="CVV"
                      keyboardType="numeric"
                      secureTextEntry
                      className="border border-border rounded-xl px-4 py-3 text-textPrimary bg-surfaceAlt"
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ── VODAFONE CASH FIELDS ── */}
          {selectedMethod === "VODAFONE_CASH" && (
            <View className="mx-4 mt-5 gap-3">
              {/* Instructions */}
              <View
                className="p-4 rounded-2xl border"
                style={{ backgroundColor: "#E6000010", borderColor: "#E60000" }}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <Ionicons name="phone-portrait" size={18} color="#E60000" />
                  <Text
                    className="font-black text-sm"
                    style={{ color: "#E60000" }}
                  >
                    Send via Vodafone Cash
                  </Text>
                </View>
                <Text className="text-textSecondary text-sm leading-5">
                  Transfer{" "}
                  <Text className="font-black text-textPrimary">
                    EGP {debt.toFixed(2)}
                  </Text>{" "}
                  to Talabat's Vodafone Cash number:
                </Text>
                <View className="mt-2 bg-white px-3 py-2 rounded-xl">
                  <Text className="font-black text-textPrimary text-lg text-center tracking-widest">
                    {TALABAT_NUMBERS.VODAFONE_CASH}
                  </Text>
                </View>
                <Text className="text-textTertiary text-xs mt-2 text-center">
                  Then enter your transaction reference below
                </Text>
              </View>

              {/* Reference Input */}
              <View className="bg-surface border border-border rounded-2xl p-4">
                <Text className="text-xs font-bold text-textSecondary mb-1.5 uppercase tracking-wide">
                  Vodafone Cash Reference Number *
                </Text>
                <TextInput
                  value={referenceNumber}
                  onChangeText={setReferenceNumber}
                  placeholder="e.g. VF123456789"
                  className="border border-border rounded-xl px-4 py-3 text-textPrimary bg-surfaceAlt"
                  autoCapitalize="none"
                />
                <Text className="text-textTertiary text-xs mt-2">
                  You'll receive this reference in your Vodafone Cash app after
                  the transfer.
                </Text>
              </View>
            </View>
          )}

          {/* ── INSTAPAY FIELDS ── */}
          {selectedMethod === "INSTAPAY" && (
            <View className="mx-4 mt-5 gap-3">
              {/* Instructions */}
              <View
                className="p-4 rounded-2xl border"
                style={{ backgroundColor: "#7C3AED10", borderColor: "#7C3AED" }}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <Ionicons name="flash" size={18} color="#7C3AED" />
                  <Text
                    className="font-black text-sm"
                    style={{ color: "#7C3AED" }}
                  >
                    Send via InstaPay
                  </Text>
                </View>
                <Text className="text-textSecondary text-sm leading-5">
                  Transfer{" "}
                  <Text className="font-black text-textPrimary">
                    EGP {debt.toFixed(2)}
                  </Text>{" "}
                  to Talabat's InstaPay ID:
                </Text>
                <View className="mt-2 bg-white px-3 py-2 rounded-xl">
                  <Text className="font-black text-textPrimary text-lg text-center tracking-widest">
                    {TALABAT_NUMBERS.INSTAPAY}
                  </Text>
                </View>
                <Text className="text-textTertiary text-xs mt-2 text-center">
                  Then enter your transaction reference below
                </Text>
              </View>

              {/* Reference Input */}
              <View className="bg-surface border border-border rounded-2xl p-4">
                <Text className="text-xs font-bold text-textSecondary mb-1.5 uppercase tracking-wide">
                  InstaPay Reference Number *
                </Text>
                <TextInput
                  value={referenceNumber}
                  onChangeText={setReferenceNumber}
                  placeholder="e.g. IP-20260606-123456"
                  className="border border-border rounded-xl px-4 py-3 text-textPrimary bg-surfaceAlt"
                  autoCapitalize="none"
                />
                <Text className="text-textTertiary text-xs mt-2">
                  Found in your bank app under InstaPay transaction history.
                </Text>
              </View>
            </View>
          )}

          {/* Error */}
          {errorMessage && (
            <View className="mx-4 mt-4 p-3 rounded-xl bg-dangerLight">
              <Text className="text-danger text-sm font-semibold">
                {errorMessage}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Submit Button — sticky bottom */}
        <View
          className="px-4 pt-3 pb-6 bg-surface border-t border-border"
          style={{ elevation: 8 }}
        >
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit() || isLoading}
            activeOpacity={0.85}
            className="py-4 rounded-2xl items-center"
            style={{
              backgroundColor:
                canSubmit() && !isLoading ? COLORS.primary : COLORS.border,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons name="lock-closed-outline" size={18} color="white" />
                <Text className="text-white font-black text-base">
                  {selectedMethod === "CREDIT_CARD"
                    ? `Pay EGP ${debt.toFixed(2)}`
                    : `Submit Payment Request`}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {selectedMethod && selectedMethod !== "CREDIT_CARD" && (
            <Text className="text-textTertiary text-xs text-center mt-2">
              Your request will be reviewed by an admin within 24 hours
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
