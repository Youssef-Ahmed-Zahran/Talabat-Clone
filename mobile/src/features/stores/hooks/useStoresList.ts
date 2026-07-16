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

  const { data: wishlistItems } = useWishlist();
  const toggleWishlistApi = useToggleWishlist();
  const wishlistedStoreIds = new Set(
    wishlistItems?.pages.flatMap((page) =>
      page.wishlist.map((item) => item.store.id),
    ) || [],
  );

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
      toggleWishlistApi.mutate(storeId);
    },
    [toggleWishlistApi],
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
