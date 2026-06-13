import { useState, useCallback } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useNearbyStores } from "../api/store.api";
import { useLocationStore } from "@src/store/locationStore";
import { useSubCategories } from "@src/features/home/api/mainCategory.api";
import { useWishlist, useToggleWishlist } from "@src/features/account/sub-features/wishlist/api/wishlist.api";
import type { Store } from "@src/features/stores/types/store.types";

export interface UseStoresListReturn {
  query: {
    categoryName: string | undefined;
    stores: Store[];
    zone: any;
    outsideZone: boolean;
    isLoading: boolean;
    isFetching: boolean;
    subCategories: any[] | undefined;
    wishlistedStoreIds: Set<string>;
  };
  state: {
    selectedSubCategory: string | null;
    setSelectedSubCategory: (id: string | null) => void;
  };
  router: {
    navigateToStore: (storeId: string) => void;
    navigateBack: () => void;
  };
  actions: {
    toggleWishlist: (storeId: string) => void;
  };
}

export function useStoresList(): UseStoresListReturn {
  const router = useRouter();
  const { categoryId, categoryName } = useLocalSearchParams<{
    categoryId?: string;
    categoryName?: string;
  }>();
  const { selectedLatitude, selectedLongitude } = useLocationStore();
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);

  const { data: subCategories } = useSubCategories(categoryId as string | null);
  const { data: nearbyData, isLoading, isFetching } = useNearbyStores(
    selectedLatitude,
    selectedLongitude,
    categoryId as string | null,
    selectedSubCategory,
  );

  const { data: wishlistItems } = useWishlist();
  const toggleWishlistApi = useToggleWishlist();

  const wishlistedStoreIds = new Set(
    (wishlistItems || []).map((item) => item.store.id),
  );

  const stores = nearbyData?.stores || [];
  const zone = nearbyData?.zone ?? null;
  const outsideZone = nearbyData?.outsideZone ?? false;

  const navigateToStore = useCallback(
    (storeId: string) => {
      router.push({ pathname: "/stores/detail", params: { storeId } });
    },
    [router],
  );

  const navigateBack = useCallback(() => router.back(), [router]);

  const toggleWishlist = useCallback((storeId: string) => {
    toggleWishlistApi.mutate(storeId);
  }, [toggleWishlistApi]);

  return {
    query: {
      categoryName,
      stores,
      zone,
      outsideZone,
      isLoading,
      isFetching,
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
    },
  };
}
