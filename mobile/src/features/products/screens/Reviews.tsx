import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "@src/constants/theme";
import { Loader } from "@src/components/loader/Loader";
import { useReviewsScreen } from "../hooks/useReviewsScreen";

export default function ReviewsScreen() {
  const { query, actions, router } = useReviewsScreen();

  const renderHeader = () => (
    <View className="px-4 pt-4 pb-2">
      {/* Store Info */}
      {query.storeData && (
        <View className="flex-row items-center mb-8">
          <View className="w-16 h-16 rounded-2xl bg-white border border-border/40 items-center justify-center overflow-hidden mr-4 shadow-sm">
            {query.storeData.logoUrl ? (
              <Image
                source={{ uri: query.storeData.logoUrl }}
                className="w-full h-full"
                resizeMode="contain"
              />
            ) : (
              <Ionicons
                name="storefront-outline"
                size={24}
                color={COLORS.textTertiary}
              />
            )}
          </View>
          <View className="justify-center">
            <Text className="text-xl font-extrabold text-textPrimary mb-1">
              {query.storeData.name}
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="star" size={14} color={COLORS.star} />
              <Text className="text-sm font-bold text-textPrimary ml-1.5 mr-1">
                {Number(
                  query.summary?.averageRating ||
                    query.storeData.averageRating ||
                    0,
                ).toFixed(1)}
              </Text>
              <Text className="text-sm text-textSecondary">
                (
                {query.summary?.totalReviews ||
                  query.storeData.totalReviews ||
                  0}
                +)
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Reviews Title */}
      <Text className="text-2xl font-bold text-textPrimary mb-4">Reviews</Text>
    </View>
  );

  const renderReview = ({ item }: { item: any }) => {
    const date = new Date(item.createdAt).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    return (
      <View className="px-4 py-4 border-b border-border/30">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <Ionicons name="star" size={16} color={COLORS.star} />
            <Text className="text-base font-bold text-textPrimary ml-1.5">
              {Number(item.rating).toFixed(1)}
            </Text>
          </View>
          {query.user && item.user?.id === query.user.id && (
            <TouchableOpacity
              onPress={() => actions.handleDeleteReview(item.id)}
              disabled={query.isDeleting}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>

        {item.comment ? (
          <Text className="text-base text-textPrimary leading-6 mb-3 text-left">
            {item.comment}
          </Text>
        ) : null}

        <Text className="text-xs text-textTertiary">
          {item.user?.fullName || "User"}, {date}
        </Text>
      </View>
    );
  };

  if (query.isLoading)
    return <Loader fullScreen message="Loading reviews..." />;

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Top Bar with Back Button */}
      <View
        className="bg-white px-4 pb-2"
        style={{ paddingTop: Platform.OS === "ios" ? 52 : 44 }}
      >
        <TouchableOpacity
          onPress={router.navigateBack}
          className="w-10 h-10 rounded-full bg-[#F5F5F5] items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Reviews List */}
      <FlatList
        data={query.reviews}
        keyExtractor={(item) => item.id}
        renderItem={renderReview}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        onEndReached={actions.loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <View className="py-6 items-center">
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="items-center py-10">
            <Text className="text-base text-textSecondary">
              No reviews yet.
            </Text>
          </View>
        }
      />
    </View>
  );
}
