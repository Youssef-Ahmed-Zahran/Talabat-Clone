import React from "react";
import { View, Text, TouchableOpacity, FlatList, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useStoresList } from "../hooks/useStoresList";
import { SubCategoryFilter } from "../components/SubCategoryFilter";
import { StoreListCard } from "../components/StoreListCard";
import { Loader } from "@src/components/loader/Loader";
import { COLORS } from "@src/constants/theme";
import type { Store } from "@src/features/stores/types/store.types";

export default function StoresListScreen() {
  const { query, state, router, actions } = useStoresList();

  const renderStore = ({ item }: { item: Store }) => (
    <View className="px-4 pt-3">
      <StoreListCard
        store={item}
        onPress={router.navigateToStore}
        isWishlisted={query.wishlistedStoreIds.has(item.id)}
        onToggleWishlist={actions.toggleWishlist}
      />
    </View>
  );

  const renderEmpty = () => (
    <View className="items-center py-20 px-8 bg-white rounded-2xl mx-4 mt-6 border border-[#E5E5E5]/60">
      <View className="w-16 h-16 rounded-full bg-[#FAF5ED] items-center justify-center mb-4">
        <Ionicons
          name="storefront-outline"
          size={32}
          color={COLORS.textTertiary}
        />
      </View>
      <Text className="text-base text-textPrimary font-bold mt-2 text-center">
        No stores found
      </Text>
      <Text className="text-xs text-textSecondary mt-1 text-center">
        Try switching the filter or check back later.
      </Text>
      {state.selectedSubCategory !== null && (
        <TouchableOpacity
          onPress={() => state.setSelectedSubCategory(null)}
          className="mt-4 bg-primary px-5 py-2 rounded-full"
          activeOpacity={0.8}
        >
          <Text className="text-white text-xs font-bold">Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Header */}
      <View
        className="bg-white border-b border-[#F0F0F0]"
        style={{ paddingTop: Platform.OS === "ios" ? 52 : 44 }}
      >
        <View className="flex-row items-center justify-between px-4 pb-3">
          <TouchableOpacity
            onPress={router.navigateBack}
            className="w-10 h-10 rounded-full bg-[#FAF9F5] items-center justify-center border border-[#EBEBEB]"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <Text
            className="text-base font-bold text-textPrimary text-center flex-1 mx-3"
            numberOfLines={1}
          >
            {query.categoryName || "Stores"}
          </Text>

          <View className="w-10" />
        </View>
      </View>

      {/* Sub-Category Filters */}
      {query.subCategories && query.subCategories.length > 0 && (
        <SubCategoryFilter
          subCategories={query.subCategories}
          selectedSubCategory={state.selectedSubCategory}
          onSelect={state.setSelectedSubCategory}
        />
      )}

      {/* Body */}
      <View className="flex-1 bg-[#F5F5F5]">
        {query.isLoading ? (
          <View className="flex-1 justify-center items-center">
            <Loader fullScreen={false} />
          </View>
        ) : query.outsideZone ? (
          <View className="flex-1 justify-center items-center px-8 bg-white">
            <View className="w-20 h-20 rounded-full bg-[#FAF5ED] items-center justify-center mb-4">
              <Ionicons name="map-outline" size={40} color={COLORS.primary} />
            </View>
            <Text className="text-lg font-bold text-textPrimary text-center mb-2">
              We're not here yet!
            </Text>
            <Text className="text-sm text-textSecondary text-center leading-relaxed">
              Your address is outside our current delivery zones. Please try a
              different location.
            </Text>
          </View>
        ) : (
          <FlatList
            data={query.stores}
            renderItem={renderStore}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            ListEmptyComponent={renderEmpty}
            onEndReached={() => {
              if (query.hasNextPage && !query.isFetchingNextPage) {
                actions.fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              query.isFetchingNextPage ? <Loader fullScreen={false} /> : null
            }
          />
        )}
      </View>
    </View>
  );
}
