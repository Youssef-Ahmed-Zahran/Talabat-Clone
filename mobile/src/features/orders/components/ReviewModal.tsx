import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@src/constants/theme";
import { useReviewModal } from "../hooks/useReviewModal";
import { ReviewModalProps } from "../types/order.types";
export function ReviewModal({
  visible,
  onClose,
  storeId,
  orderId,
  storeName,
}: ReviewModalProps) {
  const { state, actions } = useReviewModal({ storeId, orderId, onClose });

  const ratingLabels = ["", "Terrible", "Bad", "Okay", "Good", "Excellent"];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={actions.handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Backdrop */}
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={actions.handleClose}
        />

        {/* Sheet */}
        <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
          {/* Handle */}
          <View className="w-10 h-1 bg-border rounded-full self-center mb-5" />

          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1">
              <Text className="text-xl font-bold text-textPrimary">
                Rate your experience
              </Text>
              <Text className="text-sm text-textSecondary mt-1">
                {storeName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={actions.handleClose}
              className="w-9 h-9 rounded-full bg-[#F5F5F5] items-center justify-center"
            >
              <Ionicons name="close" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Stars */}
          <View className="items-center mb-2">
            <View className="flex-row gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => actions.setRating(star)}
                  activeOpacity={0.7}
                  className="p-1"
                >
                  <Ionicons
                    name={star <= state.rating ? "star" : "star-outline"}
                    size={38}
                    color={
                      star <= state.rating ? COLORS.star : COLORS.starEmpty
                    }
                  />
                </TouchableOpacity>
              ))}
            </View>
            {state.rating > 0 && (
              <Text className="text-sm font-semibold text-textSecondary mt-2">
                {ratingLabels[state.rating]}
              </Text>
            )}
          </View>

          {/* Comment */}
          <View className="mt-4 mb-6">
            <Text className="text-sm font-semibold text-textPrimary mb-2">
              Add a comment (optional)
            </Text>
            <TextInput
              className="bg-[#F5F5F5] rounded-xl px-4 py-3 text-sm text-textPrimary min-h-[100px] border border-border/40"
              placeholder="Tell us about your experience..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
              textAlignVertical="top"
              value={state.comment}
              onChangeText={actions.setComment}
              maxLength={500}
            />
            <Text className="text-xs text-textTertiary mt-1 text-right">
              {state.comment.length}/500
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            className={`h-14 rounded-xl items-center justify-center flex-row ${
              state.rating === 0 || state.isSubmitting
                ? "bg-primary/40"
                : "bg-primary"
            }`}
            onPress={actions.handleSubmit}
            disabled={state.rating === 0 || state.isSubmitting}
            activeOpacity={0.85}
          >
            {state.isSubmitting ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Ionicons
                  name="send"
                  size={18}
                  color={COLORS.white}
                  style={{ marginRight: 8 }}
                />
                <Text className="text-base font-bold text-white">
                  Submit Review
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
