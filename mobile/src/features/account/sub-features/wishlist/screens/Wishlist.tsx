import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import { View, Text, TouchableOpacity, FlatList, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWishlistScreen } from "../hooks/useWishlistScreen";
import { Loader } from "@src/components/loader/Loader";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "@src/constants/theme";

export default function WishlistScreen() {
  const { query, actions, router } = useWishlistScreen();

  if (query.isLoading) return <Loader message="Opening your favorites..." />;

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]" edges={["top"]}>
      <StatusBar style="dark" />
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-border/40">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={router.navigateBack} className="mr-3">
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-textPrimary">Wishlist</Text>
        </View>
        {query.wishlist && query.wishlist.length > 0 && (
          <TouchableOpacity
            onPress={actions.handleClearWishlist}
            disabled={query.isClearing}
          >
            <Text className="text-sm font-semibold text-primary">
              Clear All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={query.wishlist}
        keyExtractor={(item) => item.store.id}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-row items-center bg-white p-3 rounded-xl mb-2 border border-border/40"
            onPress={() => router.navigateToStore(item.store.id)}
            activeOpacity={0.8}
          >
            <View className="w-14 h-14 rounded-lg bg-[#F5F5F5] items-center justify-center overflow-hidden mr-3">
              {item.store.logoUrl ? (
                <Image
                  source={{ uri: item.store.logoUrl }}
                  className="w-full h-full"
                />
              ) : (
                <Ionicons
                  name="storefront-outline"
                  size={24}
                  color={COLORS.textTertiary}
                />
              )}
            </View>
            <View className="flex-1">
              <Text
                className="text-sm font-bold text-textPrimary"
                numberOfLines={1}
              >
                {item.store.name}
              </Text>
              <View className="flex-row items-center mt-0.5">
                <Ionicons name="star" size={12} color={COLORS.star} />
                <Text className="text-xs font-semibold text-textSecondary ml-0.5">
                  {Number(item.store.averageRating || 0).toFixed(1)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="p-2"
              onPress={() => actions.handleToggleWishlist(item.store.id)}
            >
              <Ionicons name="heart" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-16">
            <Ionicons
              name="heart-outline"
              size={56}
              color={COLORS.textTertiary}
            />
            <Text className="text-lg font-bold text-textPrimary mt-4">
              No favorites yet
            </Text>
            <Text className="text-sm text-textSecondary mt-2 text-center px-10">
              Explore restaurants and save your favorites here
            </Text>
            <TouchableOpacity
              className="mt-6 bg-primary px-8 h-12 rounded-xl items-center justify-center"
              onPress={router.navigateHome}
            >
              <Text className="text-sm font-bold text-white">
                Start Exploring
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}
