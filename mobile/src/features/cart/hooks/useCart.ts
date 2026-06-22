import { useCallback } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useCartStore } from "@src/store/cartStore";
import {
  useRemoveCartItem,
  useUpdateCartQuantity,
  useClearCart,
} from "../api/cart.api";
import type { CartItem } from "@src/features/cart/types/cart.types";
import { UseCartReturn } from "../types/cart.types";
export function useCartScreen(): UseCartReturn {
  const router = useRouter();
  const { items, cartId, storeId, itemCount } = useCartStore();
  const removeItem = useRemoveCartItem();
  const updateQty = useUpdateCartQuantity();
  const clearCart = useClearCart();

  // Compute subtotal including option extras
  const subtotal = items.reduce((sum, i) => {
    let itemTotal = Number(i.unitPrice) || 0;
    if (i.options) {
      i.options.forEach((opt) => {
        itemTotal += Number(opt.optionValue?.extraPrice) || 0;
      });
    }
    return sum + itemTotal * i.quantity;
  }, 0);

  const handleRemove = useCallback(
    (itemId: string) => {
      Alert.alert("Remove Item", "Remove this item from cart?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeItem.mutate(itemId),
        },
      ]);
    },
    [removeItem],
  );

  const handleClear = useCallback(() => {
    if (!cartId) return;
    Alert.alert("Clear Cart", "Remove all items?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => clearCart.mutate(cartId),
      },
    ]);
  }, [cartId, clearCart]);

  const handleUpdateQty = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity < 1) {
        handleRemove(itemId);
        return;
      }
      updateQty.mutate({ itemId, quantity });
    },
    [updateQty, handleRemove],
  );

  const navigateToCheckout = useCallback(() => {
    router.push({
      pathname: "/checkout",
      params: { storeId: storeId || "" },
    });
  }, [router, storeId]);

  const navigateToHome = useCallback(() => {
    router.push("/(tabs)/home");
  }, [router]);

  return {
    query: {
      items,
      cartId,
      storeId,
      itemCount,
      subtotal,
    },
    state: {
      isRemovingItem: removeItem.isPending,
      isUpdatingQty: updateQty.isPending,
      isClearingCart: clearCart.isPending,
    },
    actions: {
      handleRemove,
      handleClear,
      handleUpdateQty,
    },
    router: {
      navigateToCheckout,
      navigateToHome,
    },
  };
}
