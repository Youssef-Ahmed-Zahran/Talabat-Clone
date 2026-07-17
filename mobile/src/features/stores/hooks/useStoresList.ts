import { useState, useCallback } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useNearbyStores } from "../api/store.api";
import { useLocationStore } from "@src/store/locationStore";
import { useSubCategories } from "@src/features/home/api/mainCategory.api";
import {
  useWishlist,
  useToggleWishlist,
} from "@src/features/account/sub-features/wishlist/api/wishlist.api";
import type { Store } from "@src/features/stores/types/store.types";
import { UseStoresListReturn } from "../types/stores.types";
export function useStoresList(): UseStoresListReturn {
  const router = useRouter();
  const { categoryId, categoryName } = useLocalSearchParams<{
    categoryId?: string;
    categoryName?: string;
  }>();
  const { selectedLatitude, selectedLongitude } = useLocationStore();
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    null,
  );

  const { data: subCategories } = useSubCategories(categoryId as string | null);
  const {
    data: nearbyData,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNearbyStores(
    selectedLatitude,
    selectedLongitude,
    categoryId as string | null,
    selectedSubCategory,
  );

  const { data: wishlistItems } = useWishlist(selectedLatitude, selectedLongitude);

  const toggleWishlistApi = useToggleWishlist();
  // Local optimistic overrides: storeId → true (wishlisted) | false (not wishlisted)
  // Applied immediately on tap so the heart icon flips without waiting for the query to refetch
  const [optimisticOverrides, setOptimisticOverrides] = useState<
    Record<string, boolean>
  >({});

  const wishlistedStoreIds = new Set(
    wishlistItems?.pages.flatMap((page) =>
      page.wishlist.map((item) => item.store.id),
    ) || [],
  );

  // Apply optimistic overrides on top of the real set
  Object.entries(optimisticOverrides).forEach(([id, wishlisted]) => {
    if (wishlisted) wishlistedStoreIds.add(id);
    else wishlistedStoreIds.delete(id);
  });

  const stores = nearbyData?.pages.flatMap((page) => page.stores) || [];
  const zone = nearbyData?.pages[0]?.zone ?? null;
  const outsideZone = nearbyData?.pages[0]?.outsideZone ?? false;

  const navigateToStore = useCallback(
    (storeId: string) => {
      router.push({ pathname: "/stores/detail", params: { storeId } });
    },
    [router],
  );

  const navigateBack = useCallback(() => router.back(), [router]);

  const toggleWishlist = useCallback(
    (storeId: string) => {
      const currentlyWishlisted = wishlistedStoreIds.has(storeId);

      // 1. Flip locally — instant heart toggle ✅
      setOptimisticOverrides((prev) => ({
        ...prev,
        [storeId]: !currentlyWishlisted,
      }));

      toggleWishlistApi.mutate(storeId, {
        // 2. Clear override once server truth syncs back
        onSettled: () =>
          setOptimisticOverrides((prev) => {
            const next = { ...prev };
            delete next[storeId];
            return next;
          }),
        // 3. Rollback on failure
        onError: () =>
          setOptimisticOverrides((prev) => ({
            ...prev,
            [storeId]: currentlyWishlisted,
          })),
      });
    },
    [toggleWishlistApi, wishlistedStoreIds],
  );

  return {
    query: {
      categoryName,
      stores,
      zone,
      outsideZone,
      isLoading,
      isFetching,
      hasNextPage,
      isFetchingNextPage,
      subCategories,
      wishlistedStoreIds,
    },
    state: {
      selectedSubCategory,
      setSelectedSubCategory,
    },
    router: {
      navigateToStore,
      navigateBack,
    },
    actions: {
      toggleWishlist,
      fetchNextPage,
    },
  };
}
