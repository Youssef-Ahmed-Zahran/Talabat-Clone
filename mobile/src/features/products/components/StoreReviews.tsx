import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@src/constants/theme";
import { useStoreReviews } from "@src/features/orders/api/review.api";

interface StoreReviewsProps {
  storeId: string;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? "star" : "star-outline"}
          size={12}
          color={star <= rating ? COLORS.star : COLORS.starEmpty}
          style={{ marginRight: 1 }}
        />
      ))}
    </View>
  );
}

export function StoreReviews({ storeId }: StoreReviewsProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useStoreReviews(storeId, page, 5);

  if (isLoading) {
    return (
      <View className="py-8 items-center">
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!data || data.reviews.length === 0) {
    return (
      <View className="px-4 py-8">
        <View className="items-center">
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={40}
            color={COLORS.textTertiary}
          />
          <Text className="text-sm font-bold text-textPrimary mt-3">
            No reviews yet
          </Text>
          <Text className="text-xs text-textSecondary mt-1 text-center">
            Be the first to review this store
          </Text>
        </View>
      </View>
    );
  }

  const { reviews, summary, pagination } = data;

  return (
    <View className="px-4 pb-6">
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-base font-bold text-textPrimary">
            Customer Reviews
          </Text>
          <View className="flex-row items-center mt-1">
            <Ionicons name="star" size={14} color={COLORS.star} />
            <Text className="text-sm font-bold text-textPrimary ml-1">
              {Number(summary?.averageRating || 0).toFixed(1)}
            </Text>
            <Text className="text-xs text-textSecondary ml-1.5">
              ({summary?.totalReviews || 0} reviews)
            </Text>
          </View>
        </View>
      </View>

      {/* Review Cards */}
      {reviews.map((review) => {
        const date = new Date(review.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        return (
          <View
            key={review.id}
            className="bg-white rounded-xl border border-border/40 p-4 mb-2.5"
          >
            {/* User + Rating row */}
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center flex-1">
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-2.5">
                  <Text className="text-xs font-bold text-primary">
                    {(review.user?.fullName || "U").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm font-semibold text-textPrimary"
                    numberOfLines={1}
                  >
                    {review.user?.fullName || "User"}
                  </Text>
                  <Text className="text-[10px] text-textTertiary">{date}</Text>
                </View>
              </View>
              <StarRow rating={review.rating} />
            </View>

            {/* Comment */}
            {review.comment && (
              <Text className="text-sm text-textSecondary leading-5">
                {review.comment}
              </Text>
            )}
          </View>
        );
      })}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <View className="flex-row items-center justify-center mt-2 gap-3">
          <TouchableOpacity
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isFetching}
            className={`px-4 h-9 rounded-lg items-center justify-center border border-border/40 ${
              page === 1 ? "opacity-40" : ""
            }`}
          >
            <Text className="text-xs font-semibold text-textSecondary">
              Previous
            </Text>
          </TouchableOpacity>

          <Text className="text-xs text-textTertiary">
            {page} / {pagination.totalPages}
          </Text>

          <TouchableOpacity
            onPress={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={page === pagination.totalPages || isFetching}
            className={`px-4 h-9 rounded-lg items-center justify-center border border-border/40 ${
              page === pagination.totalPages ? "opacity-40" : ""
            }`}
          >
            <Text className="text-xs font-semibold text-textSecondary">
              Next
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
