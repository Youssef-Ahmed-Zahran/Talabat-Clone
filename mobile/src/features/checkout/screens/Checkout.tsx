import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Loader } from "@src/components/loader/Loader";
import { AddressOption } from "../components/AddressOption";
import { PaymentOption } from "../components/PaymentOption";
import { useCheckout } from "../hooks/useCheckout";
import { COLORS } from "@src/constants/theme";

const TIP_PRESETS = [0, 5, 10, 15, 20];

export default function CheckoutScreen() {
  const { query, state, totals, actions, router } = useCheckout();

  if (query.cartLoading) return <Loader message="Setting up your order..." />;

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]" edges={["top"]}>
      <StatusBar style="dark" />
      <View className="flex-row items-center px-4 py-4 bg-white border-b border-border/40">
        <TouchableOpacity onPress={router.navigateBack} className="mr-3">
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-textPrimary">Checkout</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-textPrimary">
              Delivery Address
            </Text>
            <TouchableOpacity onPress={router.navigateToAddresses}>
              <Text className="text-sm font-semibold text-primary">Change</Text>
            </TouchableOpacity>
          </View>

          {query.selectedAddressObj ? (
            <AddressOption
              address={query.selectedAddressObj}
              isSelected={true}
              onSelect={() => {}}
            />
          ) : (
            <TouchableOpacity
              className="bg-white p-4 rounded-xl border border-dashed border-primary/40 items-center flex-row justify-center"
              onPress={router.navigateToAddresses}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text className="text-primary font-semibold ml-1.5">
                Add New Address
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="mb-6">
          <Text className="text-base font-bold text-textPrimary mb-3">
            Payment Method
          </Text>
          <View className="gap-y-2">
            {(query.methods || []).map((m) => (
              <PaymentOption
                key={m.id}
                method={m}
                isSelected={state.selectedPayment === m.id}
                onSelect={state.setSelectedPayment}
              />
            ))}
          </View>
        </View>

        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Ionicons
                name="bicycle-outline"
                size={18}
                color={COLORS.textPrimary}
              />
              <Text className="text-base font-bold text-textPrimary ml-1.5">
                Tip the Driver
              </Text>
            </View>
            {state.tipAmount > 0 && (
              <Text className="text-sm font-semibold text-primary">
                +{state.tipAmount.toFixed(2)} EGP
              </Text>
            )}
          </View>
          <View className="bg-white p-4 rounded-xl border border-border/40">
            <Text className="text-sm text-textSecondary mb-3">
              Show appreciation for great service
            </Text>
            <View className="flex-row gap-x-2 mb-3">
              {TIP_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  onPress={() => state.handlePresetTip(preset)}
                  className={`flex-1 py-2.5 rounded-lg items-center border ${
                    !state.isCustom && state.tipAmount === preset
                      ? "bg-primary border-primary"
                      : "bg-white border-border/40"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      !state.isCustom && state.tipAmount === preset
                        ? "text-white"
                        : "text-textPrimary"
                    }`}
                  >
                    {preset === 0 ? "None" : `${preset}`}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => state.setIsCustom(true)}
                className={`flex-1 py-2.5 rounded-lg items-center border ${
                  state.isCustom
                    ? "bg-primary border-primary"
                    : "bg-white border-border/40"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    state.isCustom ? "text-white" : "text-textSecondary"
                  }`}
                >
                  Custom
                </Text>
              </TouchableOpacity>
            </View>

            {state.isCustom && (
              <View className="flex-row items-center bg-[#F5F5F5] rounded-lg px-3 py-2.5 border border-primary/20">
                <Text className="text-sm font-semibold text-textSecondary mr-2">
                  EGP
                </Text>
                <TextInput
                  value={state.customTip}
                  onChangeText={state.handleCustomTipChange}
                  keyboardType="decimal-pad"
                  placeholder="Enter amount"
                  placeholderTextColor={COLORS.textTertiary}
                  className="flex-1 text-sm font-semibold text-textPrimary"
                  autoFocus
                />
              </View>
            )}
          </View>
        </View>

        <View className="bg-white p-4 rounded-xl border border-border/40">
          <Text className="text-base font-bold text-textPrimary mb-4">
            Order Summary
          </Text>
          {(query.cart?.items || []).map((item: any) => (
            <View key={item.id} className="flex-row justify-between mb-3">
              <Text className="text-sm text-textSecondary flex-1 pr-4">
                {item.quantity}x {item.product?.name || "Item"}
              </Text>
              <Text className="text-sm font-semibold text-textPrimary">
                {(item.unitPrice * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View className="h-px bg-border/20 my-2" />
          <View className="flex-row justify-between py-1.5">
            <Text className="text-sm text-textTertiary">Subtotal</Text>
            <Text className="text-sm font-semibold text-textPrimary">
              {totals.subtotal.toFixed(2)} EGP
            </Text>
          </View>
          <View className="flex-row justify-between py-1.5">
            <Text className="text-sm text-textTertiary">Delivery Fee</Text>
            <Text className="text-sm font-semibold text-textPrimary">
              {totals.deliveryFee.toFixed(2)} EGP
            </Text>
          </View>
          {state.tipAmount > 0 && (
            <View className="flex-row justify-between py-1.5">
              <Text className="text-sm text-textTertiary">Driver Tip</Text>
              <Text className="text-sm font-semibold text-primary">
                +{state.tipAmount.toFixed(2)} EGP
              </Text>
            </View>
          )}
          <View className="h-px bg-border/40 my-3" />
          <View className="flex-row justify-between">
            <Text className="text-base font-bold text-textPrimary">Total</Text>
            <Text className="text-base font-bold text-primary">
              {totals.total.toFixed(2)} EGP
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white px-4 pt-4 pb-8 border-t border-border/40">
        <TouchableOpacity
          className={`h-12 rounded-xl justify-center items-center ${
            actions.isPlacingOrder ||
            !state.selectedPayment ||
            !state.selectedAddress
              ? "bg-slate-200"
              : "bg-primary"
          }`}
          onPress={actions.handlePlaceOrder}
          disabled={
            actions.isPlacingOrder ||
            !state.selectedPayment ||
            !state.selectedAddress
          }
          activeOpacity={0.9}
        >
          <Text
            className={`text-base font-bold ${
              actions.isPlacingOrder ||
              !state.selectedPayment ||
              !state.selectedAddress
                ? "text-slate-400"
                : "text-white"
            }`}
          >
            {actions.isPlacingOrder
              ? "Processing..."
              : `Place Order • ${totals.total.toFixed(2)} EGP`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
