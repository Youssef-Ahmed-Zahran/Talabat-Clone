import { useCallback } from "react";
import { useRouter } from "expo-router";
import {
  useWishlist,
  useClearWishlist,
  useToggleWishlist,
} from "../api/wishlist.api";
import { Alert } from "react-native";
import { getErrorMessage } from "@src/utils/error";

export function useWishlistScreen() {
  const router = useRouter();
  const { data: wishlistData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useWishlist();
  const wishlist = wishlistData?.pages.flatMap((page: any) => page.wishlist || []) || [];
  const clearWishlistApi = useClearWishlist();
  const toggleWishlistApi = useToggleWishlist();

  const handleClearWishlist = useCallback(() => {
    Alert.alert(
      "Clear Wishlist",
      "Are you sure you want to remove all stores from your wishlist?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            clearWishlistApi.mutate(undefined, {
              onError: (err) => Alert.alert("Error", getErrorMessage(err)),
            });
          },
        },
      ],
    );
  }, [clearWishlistApi]);

  const handleToggleWishlist = useCallback(
    (storeId: string) => {
      toggleWishlistApi.mutate(storeId, {
        onError: (err) => Alert.alert("Error", getErrorMessage(err)),
      });
    },
    [toggleWishlistApi],
  );

  const navigateBack = useCallback(() => router.back(), [router]);

  const navigateHome = useCallback(() => router.replace("/"), [router]);

  const navigateToStore = useCallback(
    (storeId: string) => {
      router.push({ pathname: "/stores/detail", params: { storeId } });
    },
    [router],
  );

  return {
    query: {
      wishlist,
      isLoading,
      isClearing: clearWishlistApi.isPending,
      hasNextPage,
      isFetchingNextPage,
    },
    actions: {
      handleClearWishlist,
      handleToggleWishlist,
      fetchNextPage,
    },
    router: {
      navigateBack,
      navigateToStore,
      navigateHome,
    },
  };
}
