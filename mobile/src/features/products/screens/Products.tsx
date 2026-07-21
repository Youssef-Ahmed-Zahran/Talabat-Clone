import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  RefreshControl,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Loader } from "@src/components/loader/Loader";
import type { Product } from "@src/features/stores/types/store.types";
import { ProductCard } from "../components/ProductCard";
import { ProductOptionsModal } from "../components/ProductOptionsModal";
import { StatusBar } from "expo-status-bar";
import { useProducts } from "../hooks/useProducts";
import { COLORS } from "@src/constants/theme";

export default function ProductsScreen() {
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const { query, state, actions, router } = useProducts();
  const expoRouter = useRouter();

  // ── Scroll sync state ──────────────────────────────────────────
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const mainScrollRef = useRef<ScrollView>(null);
  const tabScrollRef = useRef<ScrollView>(null);
  const stickyTabScrollRef = useRef<ScrollView>(null);
  const [isSticky, setIsSticky] = useState(false);
  const isStickyRef = useRef(false);
  const tabsY = useRef(0);
  // Measured height of the fixed top header (back bar) — used for sticky threshold & position
  const [fixedHeaderHeight, setFixedHeaderHeight] = useState(98);
  // Stores the Y offset of each section header in the main ScrollView
  const sectionYOffsets = useRef<number[]>([]);
  // Height of the fixed header above the sections (cover + info card + offer strip + tabs)
  const isScrollingToSection = useRef(false);

  // ── Tab press → scroll to section ────────────────────────────
  const handleTabPress = useCallback((index: number) => {
    if (!mainScrollRef.current) return;
    const y = sectionYOffsets.current[index];
    if (y === undefined) return;

    isScrollingToSection.current = true;
    setActiveSectionIndex(index);

    // Auto-scroll the tab bar to keep active tab visible
    tabScrollRef.current?.scrollTo({ x: index * 100, animated: true });
    stickyTabScrollRef.current?.scrollTo({ x: index * 100, animated: true });

    mainScrollRef.current.scrollTo({ y: Math.max(0, y - 150), animated: true });

    // After animation (~400ms), allow scroll events to update active tab again
    setTimeout(() => {
      isScrollingToSection.current = false;
    }, 500);
  }, []);

  const [deliveryInfoModalVisible, setDeliveryInfoModalVisible] =
    useState(false);

  const isTalabatDelivery =
    query.store?.deliveryType !== "STORE" &&
    query.store?.deliveryType !== "STORE_DELIVERY";

  // ── Scroll event → update active tab ─────────────────────────
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollY = e.nativeEvent.contentOffset.y;

      if (tabsY.current > 0) {
        // Sticky appears exactly when the original tab bar's top edge
        // hits the top of the ScrollView (which is exactly below the fixed header).
        const shouldBeSticky = scrollY >= tabsY.current;
        if (shouldBeSticky !== isStickyRef.current) {
          isStickyRef.current = shouldBeSticky;
          setIsSticky(shouldBeSticky);
        }
      }

      if (isScrollingToSection.current) return;

      const offsets = sectionYOffsets.current;
      let newIndex = 0;
      for (let i = offsets.length - 1; i >= 0; i--) {
        if (scrollY >= offsets[i] - 160) {
          newIndex = i;
          break;
        }
      }
      if (newIndex !== activeSectionIndex) {
        setActiveSectionIndex(newIndex);
        tabScrollRef.current?.scrollTo({ x: newIndex * 100, animated: true });
        stickyTabScrollRef.current?.scrollTo({
          x: newIndex * 100,
          animated: true,
        });
      }
    },
    [activeSectionIndex, fixedHeaderHeight],
  );

  const renderTabs = (
    ref: React.RefObject<ScrollView | null>,
    isStickyVariant: boolean,
  ) => (
    <View
      className={`bg-white border-b border-border/20 shadow-sm ${!isStickyVariant ? "z-10" : ""}`}
      onLayout={
        !isStickyVariant
          ? (e) => {
              tabsY.current = e.nativeEvent.layout.y;
            }
          : undefined
      }
    >
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: "row",
          paddingHorizontal: 16,
          height: 52,
          alignItems: "center",
        }}
      >
        <TouchableOpacity className="mr-6">
          <Ionicons
            name="menu-outline"
            size={24}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>

        {(query.sections || []).map((sec, idx) => {
          const isActive = idx === activeSectionIndex;
          return (
            <TouchableOpacity
              key={sec.id}
              onPress={() => handleTabPress(idx)}
              className={`h-full justify-center mr-6 ${isActive ? "border-b-[3px] border-black" : ""}`}
            >
              <Text
                className={`text-sm font-bold ${isActive ? "text-black" : "text-textSecondary"}`}
              >
                {sec.name} {idx === 0 ? "🔥" : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F9F9F9]">
      <StatusBar style="dark" />

      {/* Top Solid Header (Like Home Page) */}
      <View
        className="bg-white pt-14 pb-4 px-4 z-20 flex-row justify-between items-center shadow-sm border-b border-border/30"
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && h !== fixedHeaderHeight) setFixedHeaderHeight(h);
        }}
      >
        {/* Left actions: Back & Title */}
        <View className="flex-row items-center gap-3 flex-1">
          <TouchableOpacity
            onPress={() => router.navigateBack()}
            className="w-10 h-10 rounded-full bg-[#F5F5F5] items-center justify-center"
          >
            <Ionicons name="arrow-back" size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text
            className="text-lg font-bold text-textPrimary flex-shrink"
            numberOfLines={1}
          >
            {query.store?.name || "Store"}
          </Text>
        </View>

        {/* Right actions: Heart, Share, Search */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-[#F5F5F5] items-center justify-center"
            onPress={() => {
              actions.toggleWishlist();
            }}
          >
            <Ionicons
              name={query.isWishlisted ? "heart" : "heart-outline"}
              size={20}
              color={query.isWishlisted ? COLORS.primary : COLORS.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-[#F5F5F5] items-center justify-center">
            <Ionicons
              name="share-outline"
              size={20}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-[#F5F5F5] items-center justify-center"
            onPress={() => expoRouter.push("/search")}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Sticky Section Tabs (outside ScrollView so they stay fixed) ── */}
      <View
        style={{
          position: "absolute",
          top: fixedHeaderHeight, // always sits exactly below the measured header
          left: 0,
          right: 0,
          zIndex: 10,
          opacity: isSticky ? 1 : 0,
        }}
        pointerEvents={isSticky ? "auto" : "none"}
      >
        {renderTabs(stickyTabScrollRef, true)}
      </View>

      <ScrollView
        ref={mainScrollRef}
        showsVerticalScrollIndicator={false}
        className="flex-1"
        scrollEventThrottle={16}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={state.onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Cover image header */}
        <View className="h-56 bg-[#F5F5F5] w-full">
          {query.store?.coverUrl ? (
            <Image
              source={{ uri: query.store.coverUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Ionicons
                name="storefront-outline"
                size={48}
                color={COLORS.textTertiary}
              />
            </View>
          )}
        </View>

        {/* Floating Info Card */}
        <View className="mx-4 mt-[-40px] bg-white rounded-3xl p-4 shadow-sm border border-border/10">
          <TouchableOpacity
            className="flex-row items-start mb-4"
            onPress={() =>
              expoRouter.push(`/stores/reviews?storeId=${storeId}`)
            }
            activeOpacity={0.8}
          >
            {/* Logo container (left) */}
            <View className="w-16 h-16 rounded-2xl border border-border/10 bg-white items-center justify-center overflow-hidden mr-3">
              {query.store?.logoUrl ? (
                <Image
                  source={{ uri: query.store.logoUrl }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              ) : (
                <View className="items-center justify-center bg-[#8B2332] w-full h-full">
                  <Text className="text-white font-extrabold text-2xl italic">
                    W
                  </Text>
                </View>
              )}
            </View>

            {/* Details (right) */}
            <View className="flex-1 justify-center pt-1">
              <Text className="text-[19px] font-extrabold text-textPrimary text-left mb-0.5">
                {query.store?.name || "Demo Place"}
              </Text>
              <Text className="text-xs font-medium text-textSecondary text-left mb-1.5">
                {query.store?.mainCategory?.name || "food"}
              </Text>

              {/* Rating */}
              <View className="flex-row items-center">
                <Ionicons name="star" size={14} color="#FFC107" />
                <Text className="text-sm font-bold text-textPrimary ml-1.5 mr-1">
                  {Number(query.store?.averageRating || 4.3).toFixed(1)}
                </Text>
                <Text className="text-xs text-textSecondary font-medium">
                  ({query.store?.totalReviews || "1k"}+)
                </Text>
              </View>
            </View>

            {/* Chevron */}
            <View className="pt-2">
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textSecondary}
              />
            </View>
          </TouchableOpacity>

          {/* Delivery Details */}
          <View className="flex-row items-center justify-start gap-1.5 mb-3">
            <View className="flex-row items-center">
              <Ionicons
                name="time-outline"
                size={16}
                color={COLORS.textPrimary}
              />
              <Text className="text-sm font-bold text-textPrimary ml-1.5">
                {query.store?.deliveryTimeMinutes || 30} mins
              </Text>
            </View>
            <Text className="text-textTertiary text-xs px-1.5">•</Text>
            <View className="flex-row items-center">
              <Ionicons
                name="bicycle-outline"
                size={18}
                color={COLORS.textPrimary}
              />
              <Text className="text-sm font-bold text-textPrimary ml-1.5">
                {query.store?.deliveryFees === 0
                  ? "Free"
                  : `${query.store?.deliveryFees || "Free"}`}
              </Text>
            </View>
            <Text className="text-textTertiary text-xs px-1.5">•</Text>
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => setDeliveryInfoModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text className="text-sm font-medium text-textPrimary">
                Delivered by{" "}
                {isTalabatDelivery ? (
                  <Text className="text-[#FF5A00] font-extrabold">talabat</Text>
                ) : (
                  <Text className="font-extrabold text-textPrimary">
                    the restaurant
                  </Text>
                )}
              </Text>
              <Ionicons
                name="information-circle-outline"
                size={14}
                color={COLORS.textSecondary}
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          </View>

          {/* Promo strip */}
          <View className="bg-[#FFF5ED] rounded-xl py-2 px-3 flex-row items-center justify-center">
            <Ionicons name="bicycle" size={18} color="#D95000" />
            <Text className="text-xs font-bold text-[#D95000] ml-2">
              Free delivery on your first order
            </Text>
          </View>
        </View>

        {/* Mastercard Offer strip */}
        <View className="mx-4 my-4 bg-[#F2E8D9] rounded-2xl py-3.5 px-4 flex-row items-center justify-between">
          <Text className="text-sm font-bold text-textPrimary">
            20% off with Mastercard
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="card" size={24} color="#FF5A00" />
            <TouchableOpacity className="ml-3">
              <Text className="text-sm font-bold text-textPrimary underline">
                More info
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Horizontal Section Tabs ────────────────────────────────── */}
        {renderTabs(tabScrollRef, false)}

        {/* ── Section title & Menu ───────────────────────────────────── */}
        <View className="px-4 py-4">
          {query.isLoading ? (
            <Loader fullScreen={false} message="Preparing the menu..." />
          ) : (
            <View>
              {(query.sections || []).map((section, sectionIndex) => (
                <View
                  key={section.id}
                  className="mb-6"
                  onLayout={(e) => {
                    // Store the Y offset of each section for scroll targeting
                    sectionYOffsets.current[sectionIndex] =
                      e.nativeEvent.layout.y + 56 + 16; // tabs height + padding
                  }}
                >
                  <Text className="text-base font-bold text-textPrimary text-left mb-1">
                    {section.name} 🔥
                  </Text>
                  <Text className="text-xs text-textSecondary text-left mb-4">
                    Trending products you'll love
                  </Text>
                  <View
                    className={
                      sectionIndex === 0
                        ? "flex-row flex-wrap justify-between"
                        : ""
                    }
                  >
                    {(section.products || []).map((product: Product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={actions.handleAddToCart}
                        layout={sectionIndex === 0 ? "grid" : "list"}
                      />
                    ))}
                  </View>
                </View>
              ))}

              {(!query.sections || query.sections.length === 0) && (
                <View className="items-center justify-center py-16">
                  <Ionicons
                    name="list-outline"
                    size={48}
                    color={COLORS.textTertiary}
                  />
                  <Text className="text-base font-bold text-textPrimary mt-3">
                    Menu is empty
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
      <View className="bg-white border-t border-border/30 py-4 px-6 items-center justify-center shadow-lg">
        <Text className="text-xs font-bold text-textSecondary text-center">
          Add {query.store?.minimumOrderCost || "50.00"} EGP to start your order
        </Text>
      </View>

      <ProductOptionsModal
        visible={state.isModalVisible}
        product={state.selectedProduct}
        storeId={storeId || ""}
        onClose={() => actions.closeModal()}
      />

      {/* Delivery Info Modal */}
      <Modal
        visible={deliveryInfoModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDeliveryInfoModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setDeliveryInfoModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="bg-white rounded-t-3xl pt-2 pb-8 px-5 w-full max-h-[85%]"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle Bar */}
            <View className="w-12 h-[5px] bg-[#E5E5E5] rounded-full self-center mb-5" />

            {/* Close Button */}
            <TouchableOpacity
              className="w-10 h-10 rounded-full border border-gray-100 items-center justify-center absolute top-3 left-4 z-10 bg-white"
              onPress={() => setDeliveryInfoModalVisible(false)}
            >
              <Ionicons name="close" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Graphic (Talabat vs Restaurant) */}
              <View className="items-center mt-8 mb-8">
                {isTalabatDelivery ? (
                  // Talabat graphic
                  <Ionicons name="bicycle" size={100} color="#FF5A00" />
                ) : (
                  // Restaurant graphic with X
                  <View className="relative items-center justify-center">
                    <Ionicons name="bicycle" size={100} color="#4A1515" />
                    <View className="absolute top-[0px] left-[-15px] bg-[#FF5A00] rounded-full items-center justify-center w-10 h-10 border-[3px] border-white">
                      <Ionicons name="close-outline" size={24} color="white" />
                    </View>
                  </View>
                )}
              </View>

              <Text className="text-2xl font-extrabold text-textPrimary mb-3">
                Delivered by{" "}
                {isTalabatDelivery ? (
                  <Text className="text-[#FF5A00]">talabat</Text>
                ) : (
                  "the restaurant"
                )}
              </Text>

              <Text className="text-[15px] text-textSecondary leading-6 mb-8">
                {isTalabatDelivery
                  ? "We always want to deliver the best experience for you. This restaurant uses talabat riders to deliver your food which means:"
                  : "This restaurant uses their own rider to deliver your food. This means:"}
              </Text>

              {/* List items */}
              {isTalabatDelivery ? (
                <>
                  <View className="flex-row mb-7 items-start pr-4">
                    <Ionicons
                      name="location"
                      size={28}
                      color="#FF5A00"
                      className="mr-4 mt-0.5"
                    />
                    <View className="flex-1 ml-4">
                      <Text className="text-[15px] font-bold text-textPrimary mb-1.5">
                        Track your order with constant live updates
                      </Text>
                      <Text className="text-[14px] text-textSecondary leading-5">
                        When you place your order, we can show you where it is
                        in real-time
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row mb-7 items-start pr-4">
                    <Ionicons
                      name="time"
                      size={28}
                      color="#FF5A00"
                      className="mr-4 mt-0.5"
                    />
                    <View className="flex-1 ml-4">
                      <Text className="text-[15px] font-bold text-textPrimary mb-1.5">
                        On time delivery
                      </Text>
                      <Text className="text-[14px] text-textSecondary leading-5">
                        When you place your order, we can show you what time it
                        will arrive
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-start pr-4">
                    <Ionicons
                      name="headset"
                      size={28}
                      color="#FF5A00"
                      className="mr-4 mt-0.5"
                    />
                    <View className="flex-1 ml-4">
                      <Text className="text-[15px] font-bold text-textPrimary mb-1.5">
                        Our talabat chat agents are here for you
                      </Text>
                      <Text className="text-[14px] text-textSecondary leading-5">
                        If something goes wrong with your order, we can assist
                        you
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View className="flex-row mb-7 items-start pr-4">
                    <Ionicons
                      name="location-outline"
                      size={28}
                      color={COLORS.textPrimary}
                      className="mr-4 mt-0.5"
                    />
                    <View className="flex-1 ml-4">
                      <Text className="text-[15px] font-bold text-textPrimary mb-1.5">
                        No live tracking for your order
                      </Text>
                      <Text className="text-[14px] text-textSecondary leading-5">
                        You'll need to get in touch with the restaurant directly
                        to find out the status of your order
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row mb-7 items-start pr-4">
                    <Ionicons
                      name="time-outline"
                      size={28}
                      color={COLORS.textPrimary}
                      className="mr-4 mt-0.5"
                    />
                    <View className="flex-1 ml-4">
                      <Text className="text-[15px] font-bold text-textPrimary mb-1.5">
                        The delivery time may vary
                      </Text>
                      <Text className="text-[14px] text-textSecondary leading-5">
                        We aren't able to track the restaurant's riders, so
                        delivery time updates will not be available
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-start pr-4">
                    <Ionicons
                      name="call-outline"
                      size={28}
                      color={COLORS.textPrimary}
                      className="mr-4 mt-0.5"
                    />
                    <View className="flex-1 ml-4">
                      <Text className="text-[15px] font-bold text-textPrimary mb-1.5">
                        Limited support
                      </Text>
                      <Text className="text-[14px] text-textSecondary leading-5">
                        If something goes wrong with your order, we may not be
                        able to give you the support you need. You will have to
                        contact the restaurant
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
