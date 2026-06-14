import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useCreateReview } from "../api/review.api";
import { getErrorMessage } from "@src/utils/error";

interface UseReviewModalProps {
  storeId: string;
  orderId: string;
  onClose: () => void;
}

export function useReviewModal({ storeId, orderId, onClose }: UseReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const createReview = useCreateReview();

  const handleClose = useCallback(() => {
    setRating(0);
    setComment("");
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(() => {
    if (rating === 0) {
      Alert.alert("Rating required", "Please select a star rating.");
      return;
    }

    createReview.mutate(
      {
        storeId,
        orderId,
        rating,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert("Thank you! ⭐", "Your review has been submitted.");
          setRating(0);
          setComment("");
          onClose();
        },
        onError: (err) => {
          Alert.alert("Error", getErrorMessage(err));
        },
      },
    );
  }, [rating, comment, storeId, orderId, createReview, onClose]);

  return {
    state: {
      rating,
      comment,
      isSubmitting: createReview.isPending,
    },
    actions: {
      setRating,
      setComment,
      handleSubmit,
      handleClose,
    },
  };
}
