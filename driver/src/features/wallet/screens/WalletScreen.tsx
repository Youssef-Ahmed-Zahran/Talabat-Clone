import React from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@constants/theme";
import { useWalletScreen } from "../hooks/useWalletScreen";
import { WalletBalanceCard } from "../components/WalletBalanceCard";
import { TransactionRow } from "../components/TransactionRow";
import { DebtPaymentRow } from "../components/DebtPaymentRow";

export default function WalletScreen() {
  const router = useRouter();
  const { query, state, actions } = useWalletScreen();
  const {
    balance,
    debt,
    hasDebt,
    isSuspended,
    data,
    isLoading,
    isRefetching,
    isFetchingNextPage,
  } = query;
  const { activeTab, setActiveTab, isTransactions } = state;
  const { handleRefresh, handleEndReached } = actions;

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-surfaceAlt items-center justify-center"
        edges={["top"]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surfaceAlt" edges={["top"]}>
      {/* Header */}
      <View className="px-5 pt-4 pb-3 bg-surface border-b border-border flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-black text-textPrimary">Wallet</Text>
          <Text className="text-sm text-textSecondary mt-0.5">
            Your balance & transactions
          </Text>
        </View>
        {hasDebt && (
          <View className="bg-dangerLight px-3 py-1 rounded-full">
            <Text className="text-danger text-xs font-bold">
              Debt: {debt.toFixed(0)} EGP
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Balance Card */}
            <WalletBalanceCard
              balance={balance}
              debt={debt}
              hasDebt={hasDebt}
              isSuspended={isSuspended}
              onPayDebt={() => router.push("/wallet/repay")}
            />

            {/* How it works — shown only if driver has debt */}
            {hasDebt && (
              <View className="mx-4 mt-4 p-4 rounded-2xl bg-warningLight border border-warning/20">
                <View className="flex-row items-center gap-2 mb-2">
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color={COLORS.warning}
                  />
                  <Text
                    className="font-bold text-sm"
                    style={{ color: COLORS.warning }}
                  >
                    Why do I have a debt?
                  </Text>
                </View>
                <Text className="text-textSecondary text-sm leading-5">
                  When you collect cash from a customer, the full order amount
                  is debited from your wallet. Your delivery earnings are
                  credited back, leaving you owing the difference (store payment
                  + Talabat fee) to Talabat.
                </Text>
              </View>
            )}

            {/* Tabs */}
            <View className="flex-row mx-4 mt-6 mb-4 bg-surface p-1 rounded-xl border border-border">
              <TouchableOpacity
                onPress={() => setActiveTab("transactions")}
                className={`flex-1 py-2 items-center rounded-lg ${isTransactions ? "bg-primary" : "bg-transparent"}`}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-sm font-bold ${isTransactions ? "text-white" : "text-textSecondary"}`}
                >
                  Transactions
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab("payments")}
                className={`flex-1 py-2 items-center rounded-lg ${!isTransactions ? "bg-primary" : "bg-transparent"}`}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-sm font-bold ${!isTransactions ? "text-white" : "text-textSecondary"}`}
                >
                  Debt Payments
                </Text>
              </TouchableOpacity>
            </View>

            {/* Section Header */}
            {data.length > 0 && (
              <View className="mx-4 mb-3 flex-row items-center justify-between">
                <Text className="text-xs font-black text-textTertiary uppercase tracking-widest">
                  {isTransactions ? "Recent Transactions" : "Payment History"}
                </Text>
                <Text className="text-xs text-textSecondary">
                  {data.length} entries
                </Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) =>
          isTransactions ? (
            <TransactionRow item={item} />
          ) : (
            <DebtPaymentRow item={item} />
          )
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          <View className="items-center py-20 mx-4">
            <View className="w-20 h-20 rounded-full bg-primarySoft items-center justify-center mb-4">
              <Ionicons
                name={isTransactions ? "wallet-outline" : "cash-outline"}
                size={36}
                color={COLORS.primary}
              />
            </View>
            <Text className="text-lg font-black text-textPrimary">
              No {isTransactions ? "transactions" : "payments"} yet
            </Text>
            <Text className="text-sm text-textSecondary mt-2 text-center px-8">
              {isTransactions
                ? "Complete deliveries to see your wallet activity here."
                : "You have not made any debt payments yet."}
            </Text>
          </View>
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
