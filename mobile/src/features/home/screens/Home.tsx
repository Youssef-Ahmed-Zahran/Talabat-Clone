import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Loader } from "@src/components/loader/Loader";
import { CategoryCard } from "../components/CategoryCard";
import { ActiveOrderBanner } from "../components/ActiveOrderBanner";
import { Banners } from "../components/Banners";
import { StoreCard } from "../components/StoreCard";
import { useHome } from "../hooks/useHome";
import { COLORS } from "@src/constants/theme";
import type {
  MainCategory,
  Store,
} from "@src/features/stores/types/store.types";

export default function HomeScreen() {
  const { query, state, tracking, router } = useHome();
  const expoRouter = useRouter();

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      {/* Header — Orange header with deliver location */}
      <View className="bg-primary pt-14 pb-8 px-4 relative overflow-hidden">
        {/* Top Header Row: Notification + Location select */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            className="flex-row items-center flex-1 mr-3"
            onPress={router.navigateToLocation}
            activeOpacity={0.8}
          >
            <View
              className="w-9 h-9 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
            >
              <Ionicons
                name="location-outline"
                size={18}
                color={COLORS.white}
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-[11px] font-medium"
                style={{ color: "rgba(255, 255, 255, 0.8)" }}
              >
                Deliver to
              </Text>
              <View className="flex-row items-center">
                <Text
                  className="text-sm font-bold text-white flex-shrink mr-1"
                  numberOfLines={1}
                >
                  {state.defaultAddress?.label ||
                    state.defaultAddress?.street ||
                    "Select address"}
                </Text>
                <Ionicons name="chevron-down" size={14} color={COLORS.white} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Notification bell */}
          <TouchableOpacity
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={COLORS.white}
            />
            <View className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white border border-primary" />
          </TouchableOpacity>
        </View>

        {/* Custom White Search Bar Design - Redirects to search screen */}
        <TouchableOpacity
          className="flex-row bg-white rounded-full px-4 h-12 items-center mb-4 border border-[#E5E5E5]"
          onPress={() => expoRouter.push("/search")}
          activeOpacity={0.9}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={COLORS.textTertiary}
            className="mr-3"
          />
          <Text className="text-textTertiary font-medium text-sm flex-1 text-left">
            Search for food, coffee, groceries...
          </Text>
        </TouchableOpacity>

        {/* Promo sub-strip */}
        <View className="flex-row items-center justify-between px-4 mt-3">
          <View className="flex-row items-center">
            <Ionicons name="flash" size={14} color="#FFF04B" />
            <Text className="text-white font-bold text-[11px] ml-1">
              Up to 50% off on your favorite restaurants
            </Text>
          </View>
          <View className="bg-[#FFF0E6] rounded px-1.5 py-0.5 flex-row items-center">
            <Text className="text-primary font-black text-[9px] tracking-wider">
              pro DAY
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 mt-[-16px] rounded-t-3xl bg-[#F5F5F5]"
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={state.onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Categories — horizontal scroll */}
        <View className="bg-white pb-5 pt-5 rounded-t-3xl">
          {query.catLoading ? (
            <View className="h-24 justify-center">
              <Loader fullScreen={false} />
            </View>
          ) : (
            <FlatList
              data={query.categories || []}
              renderItem={({ item }: { item: MainCategory }) => (
                <CategoryCard
                  category={item}
                  onPress={router.navigateToCategory}
                />
              )}
              keyExtractor={(i) => i.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              className="flex-row"
            />
          )}
        </View>

        {/* Promo Banners Carousel */}
        <Banners />

        {/* What's on your mind? Cuisine Types */}
        <View className="px-4 py-4 bg-white mt-2">
          <Text className="text-sm font-bold text-textPrimary mb-3 text-left">
            What's on your mind?
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: "row", gap: 14 }}
          >
            {/* Cuisine 1: Pizza */}
            <TouchableOpacity
              className="items-center w-14"
              activeOpacity={0.7}
              onPress={router.navigateToAllStores}
            >
              <View className="w-12 h-12 rounded-full bg-[#FFF8F2] items-center justify-center border border-[#FFE7C8]">
                <Ionicons
                  name="pizza-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </View>
              <Text className="text-[10px] font-bold text-textSecondary mt-1.5">
                Pizza
              </Text>
            </TouchableOpacity>

            {/* Cuisine 2: Burgers */}
            <TouchableOpacity
              className="items-center w-14"
              activeOpacity={0.7}
              onPress={router.navigateToAllStores}
            >
              <View className="w-12 h-12 rounded-full bg-[#FFF8F2] items-center justify-center border border-[#FFE7C8]">
                <Ionicons
                  name="fast-food-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </View>
              <Text className="text-[10px] font-bold text-textSecondary mt-1.5">
                Burgers
              </Text>
            </TouchableOpacity>

            {/* Cuisine 3: Coffee */}
            <TouchableOpacity
              className="items-center w-14"
              activeOpacity={0.7}
              onPress={router.navigateToAllStores}
            >
              <View className="w-12 h-12 rounded-full bg-[#FFF8F2] items-center justify-center border border-[#FFE7C8]">
                <Ionicons
                  name="cafe-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </View>
              <Text className="text-[10px] font-bold text-textSecondary mt-1.5">
                Coffee
              </Text>
            </TouchableOpacity>

            {/* Cuisine 4: Sweets */}
            <TouchableOpacity
              className="items-center w-14"
              activeOpacity={0.7}
              onPress={router.navigateToAllStores}
            >
              <View className="w-12 h-12 rounded-full bg-[#FFF8F2] items-center justify-center border border-[#FFE7C8]">
                <Ionicons
                  name="ice-cream-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </View>
              <Text className="text-[10px] font-bold text-textSecondary mt-1.5">
                Desserts
              </Text>
            </TouchableOpacity>

            {/* Cuisine 5: Healthy */}
            <TouchableOpacity
              className="items-center w-14"
              activeOpacity={0.7}
              onPress={router.navigateToAllStores}
            >
              <View className="w-12 h-12 rounded-full bg-[#FFF8F2] items-center justify-center border border-[#FFE7C8]">
                <Ionicons
                  name="leaf-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </View>
              <Text className="text-[10px] font-bold text-textSecondary mt-1.5">
                Healthy
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Use and Save Section */}
        <View className="px-4 py-4 bg-white mt-2">
          <Text className="text-sm font-bold text-textPrimary text-left mb-3">
            Use & Save
          </Text>
          <View className="flex-row justify-between">
            {/* Vouchers */}
            <TouchableOpacity className="flex-1 bg-white border border-[#E5E5E5] rounded-2xl p-4 flex-row items-center mr-2">
              <View
                className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: "rgba(255, 90, 0, 0.1)" }}
              >
                <Ionicons name="ticket" size={22} color={COLORS.primary} />
              </View>
              <Text className="text-sm font-bold text-textPrimary text-left flex-1">
                Vouchers
              </Text>
            </TouchableOpacity>

            {/* Rewards */}
            <TouchableOpacity className="flex-1 bg-white border border-[#E5E5E5] rounded-2xl p-4 flex-row items-center ml-2">
              <View className="w-10 h-10 bg-orange-100 rounded-xl items-center justify-center mr-3">
                <Text className="text-primary font-black text-lg italic">
                  t
                </Text>
              </View>
              <Text className="text-sm font-bold text-textPrimary text-left flex-1">
                Rewards
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* pro banner */}
        <TouchableOpacity className="mx-4 my-3 bg-[#8C33FF] rounded-2xl overflow-hidden flex-row p-4 items-center">
          <View
            className="w-20 h-20 items-center justify-center mr-3 rounded-2xl"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <Ionicons name="people" size={44} color={COLORS.white} />
          </View>
          <View className="flex-1 pr-2">
            <View className="flex-row items-center mb-1">
              <Text className="text-white font-bold text-base text-left">
                Family Package
              </Text>
              <View
                className="rounded px-1.5 py-0.5 ml-1.5"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
              >
                <Text className="text-white font-extrabold text-[10px]">
                  pro
                </Text>
              </View>
            </View>
            <Text
              className="text-[11px] text-left mb-2 leading-relaxed"
              style={{ color: "rgba(255, 255, 255, 0.95)" }}
            >
              Free delivery and exclusive offers for everyone
            </Text>
            <TouchableOpacity className="bg-white rounded-full px-3 py-1 self-start">
              <Text className="text-[#8C33FF] font-bold text-[10px]">
                Try for Free
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Order It Again */}
        <View className="px-4 py-4 bg-white mt-2">
          <Text className="text-sm font-bold text-textPrimary mb-3 text-left">
            Order It Again
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: "row", gap: 12 }}
          >
            <TouchableOpacity
              className="bg-[#FAF9F5] border border-[#E5E5E5] rounded-2xl p-3 flex-row items-center w-56"
              onPress={router.navigateToAllStores}
            >
              <View
                className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: "rgba(255, 90, 0, 0.1)" }}
              >
                <Ionicons name="restaurant" size={20} color={COLORS.primary} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-xs font-bold text-textPrimary"
                  numberOfLines={1}
                >
                  Spacca Crepes
                </Text>
                <Text
                  className="text-[9px] text-textSecondary mt-0.5"
                  numberOfLines={1}
                >
                  Jumbo Crunch Crepe
                </Text>
                <Text className="text-xs font-bold text-primary mt-1">
                  115.00 EGP
                </Text>
              </View>
              <TouchableOpacity
                className="bg-primary rounded-full w-7 h-7 items-center justify-center"
                onPress={router.navigateToAllStores}
              >
                <Ionicons name="refresh" size={14} color="white" />
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-[#FAF9F5] border border-[#E5E5E5] rounded-2xl p-3 flex-row items-center w-56"
              onPress={router.navigateToAllStores}
            >
              <View className="w-12 h-12 bg-orange-100 rounded-xl items-center justify-center mr-3">
                <Ionicons name="cafe" size={20} color="#6F4E37" />
              </View>
              <View className="flex-1">
                <Text
                  className="text-xs font-bold text-textPrimary"
                  numberOfLines={1}
                >
                  Starbucks Coffee
                </Text>
                <Text
                  className="text-[9px] text-textSecondary mt-0.5"
                  numberOfLines={1}
                >
                  Caramel Macchiato
                </Text>
                <Text className="text-xs font-bold text-primary mt-1">
                  95.00 EGP
                </Text>
              </View>
              <TouchableOpacity
                className="bg-primary rounded-full w-7 h-7 items-center justify-center"
                onPress={router.navigateToAllStores}
              >
                <Ionicons name="refresh" size={14} color="white" />
              </TouchableOpacity>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Popular Brands logos row */}
        <View className="px-4 py-4 bg-white mt-2">
          <Text className="text-sm font-bold text-textPrimary mb-3 text-left">
            Popular Brands
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: "row", gap: 16 }}
          >
            {/* Brand 1: McDonald's */}
            <TouchableOpacity
              className="items-center w-16"
              onPress={router.navigateToAllStores}
            >
              <View className="w-14 h-14 rounded-full bg-red-600 items-center justify-center border border-[#E5E5E5] overflow-hidden">
                <Text className="text-yellow-400 text-3xl font-black italic">
                  M
                </Text>
              </View>
              <Text
                className="text-[10px] font-bold text-textPrimary mt-1.5"
                numberOfLines={1}
              >
                McDonald's
              </Text>
            </TouchableOpacity>

            {/* Brand 2: KFC */}
            <TouchableOpacity
              className="items-center w-16"
              onPress={router.navigateToAllStores}
            >
              <View className="w-14 h-14 rounded-full bg-red-700 items-center justify-center border border-[#E0E0E0] overflow-hidden">
                <Text className="text-white text-base font-bold italic">
                  KFC
                </Text>
              </View>
              <Text
                className="text-[10px] font-bold text-textPrimary mt-1.5"
                numberOfLines={1}
              >
                KFC
              </Text>
            </TouchableOpacity>

            {/* Brand 3: Pizza Hut */}
            <TouchableOpacity
              className="items-center w-16"
              onPress={router.navigateToAllStores}
            >
              <View className="w-14 h-14 rounded-full bg-black items-center justify-center border border-[#333] overflow-hidden">
                <Ionicons name="pizza" size={24} color="#E00000" />
              </View>
              <Text
                className="text-[10px] font-bold text-textPrimary mt-1.5"
                numberOfLines={1}
              >
                Pizza Hut
              </Text>
            </TouchableOpacity>

            {/* Brand 4: Starbucks */}
            <TouchableOpacity
              className="items-center w-16"
              onPress={router.navigateToAllStores}
            >
              <View className="w-14 h-14 rounded-full bg-[#006241] items-center justify-center border border-[#004221] overflow-hidden">
                <Ionicons name="cafe" size={24} color="white" />
              </View>
              <Text
                className="text-[10px] font-bold text-textPrimary mt-1.5"
                numberOfLines={1}
              >
                Starbucks
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Active Order Banner */}
        {tracking.activeOrderId && !tracking.isFinished && (
          <ActiveOrderBanner
            orderId={tracking.activeOrderId}
            currentStatus={tracking.currentStatus}
            currentStep={tracking.currentStep}
            STATUS_STEPS={tracking.STATUS_STEPS}
            deliveryType={tracking.deliveryType}
            onPress={() => router.navigateToTracking(tracking.activeOrderId!)}
          />
        )}

        {/* All Restaurants List */}
        <View className="px-4 pb-12 pt-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-bold text-textPrimary">
              All Restaurants
            </Text>
            <TouchableOpacity onPress={router.navigateToAllStores}>
              <Text className="text-primary text-sm font-bold">See all</Text>
            </TouchableOpacity>
          </View>

          {query.storesLoading ? (
            <Loader fullScreen={false} />
          ) : (
            <View>
              {(query.stores || []).slice(0, 5).map((store: Store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  onPress={router.navigateToStore}
                />
              ))}
              {(!query.stores || query.stores.length === 0) && (
                <View className="items-center py-16 bg-white rounded-xl border border-border/60">
                  <Ionicons
                    name="storefront-outline"
                    size={48}
                    color={COLORS.textTertiary}
                  />
                  <Text className="text-base text-textSecondary font-semibold mt-3">
                    No stores found nearby
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
