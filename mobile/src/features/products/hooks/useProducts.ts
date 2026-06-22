import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useStoreSections } from "../api/product.api";
import { useStoreById } from "@src/features/stores/api/store.api";
import { useAddToCart } from "@src/features/cart/api/cart.api";
import {
  useCheckWishlistStatus,
  useToggleWishlist,
} from "@src/features/account/sub-features/wishlist/api/wishlist.api";
import { getErrorMessage } from "@src/utils/error";
import type { Product } from "@src/features/stores/types/store.types";
import { isStoreOpen, storeHoursLabel } from "@src/utils/storeHours";
import { UseProductsReturn } from "../types/products.types";
export function useProducts(): UseProductsReturn {
  const router = useRouter();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const { data: store, refetch: refetchStore } = useStoreById(storeId || "");
  const {
    data: sections,
    isLoading,
    isFetching,
    refetch: refetchSections,
  } = useStoreSections(storeId || "");
  const addToCart = useAddToCart();
  const { data: isWishlisted } = useCheckWishlistStatus(storeId || "");
  const toggleWishlistApi = useToggleWishlist();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const navigateBack = useCallback(() => router.back(), [router]);
  const closeModal = useCallback(() => setIsModalVisible(false), []);

  const storeIsOpen = isStoreOpen(
    store?.openTime,
    store?.closeTime,
    store?.overtimeOpenTime,
    store?.overtimeCloseTime,
  );
  const hoursLabel = storeHoursLabel(
    store?.openTime,
    store?.closeTime,
    store?.overtimeOpenTime,
    store?.overtimeCloseTime,
  );

  const refetchAll = useCallback(async () => {
    await Promise.all([refetchStore(), refetchSections()]);
  }, [refetchStore, refetchSections]);

  const handleAddToCart = useCallback(
    (product: Product) => {
      if (!storeId) return;

      if (!storeIsOpen && store?.openTime && store?.closeTime) {
        Alert.alert(
          "Store is closed",
          hoursLabel ??
            "This store is currently closed. Please come back later.",
        );
        return;
      }

      // Always show the modal so users can see image/details and select quantity
      setSelectedProduct(product);
      setIsModalVisible(true);
    },
    [storeId, addToCart, storeIsOpen, store, hoursLabel],
  );

  const handleAddToCartWithOptions = useCallback(
    (productId: string, quantity: number, selectedOptions: string[]) => {
      if (!storeId) return;
      addToCart.mutate(
        { storeId, productId, quantity, selectedOptions },
        {
          onSuccess: () => Alert.alert("Added! 🎉", "Item added to cart"),
          onError: (err) => Alert.alert("Error", getErrorMessage(err)),
        },
      );
    },
    [storeId, addToCart],
  );

  const toggleWishlist = useCallback(() => {
    if (storeId) toggleWishlistApi.mutate(storeId);
  }, [storeId, toggleWishlistApi]);

  return {
    query: {
      store,
      sections,
      isLoading,
      isFetching,
      refetch: refetchAll,
      isAddingToCart: addToCart.isPending,
      storeIsOpen,
      hoursLabel,
      isWishlisted: !!isWishlisted,
    },
    state: {
      selectedProduct,
      isModalVisible,
    },
    actions: {
      handleAddToCart,
      handleAddToCartWithOptions,
      closeModal,
      toggleWishlist,
    },
    router: {
      navigateBack,
    },
  };
}
