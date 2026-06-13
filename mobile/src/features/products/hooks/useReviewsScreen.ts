import { useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "@src/store/authStore";
import { useStoreById } from "@src/features/stores/api/store.api";
import {
  useInfiniteStoreReviews,
  useDeleteReview,
} from "@src/features/orders/api/review.api";
import { Alert } from "react-native";
import { getErrorMessage } from "@src/utils/error";

export function useReviewsScreen() {
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const deleteReviewApi = useDeleteReview();

  const { data: storeData } = useStoreById(storeId || "");
  const {
    data: reviewsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteStoreReviews(storeId || "", 15);

  const reviews = reviewsData?.pages.flatMap((page) => page.reviews) || [];
  const summary = reviewsData?.pages[0]?.summary;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDeleteReview = useCallback(
    (reviewId: string) => {
      Alert.alert(
        "Delete Review",
        "Are you sure you want to delete your review?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              deleteReviewApi.mutate(
                { reviewId, storeId: storeId || "" },
                {
                  onError: (err) => Alert.alert("Error", getErrorMessage(err)),
                }
              );
            },
          },
        ]
      );
    },
    [deleteReviewApi, storeId]
  );

  const navigateBack = useCallback(() => router.back(), [router]);

  return {
    query: {
      storeData,
      reviews,
      summary,
      isLoading,
      isFetchingNextPage,
      user,
      isDeleting: deleteReviewApi.isPending,
    },
    actions: {
      loadMore,
      handleDeleteReview,
    },
    router: {
      navigateBack,
    },
  };
}
