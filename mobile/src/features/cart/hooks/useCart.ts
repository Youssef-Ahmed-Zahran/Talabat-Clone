import { useCallback, useRef } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useCartStore } from "@src/store/cartStore";
import {
  useRemoveCartItem,
  useUpdateCartQuantity,
  useClearCart,
} from "../api/cart.api";
import { UseCartReturn } from "../types/cart.types";
export function useCartScreen(): UseCartReturn {
  const router = useRouter();
  const { items, cartId, storeId, itemCount } = useCartStore();
  const removeItem = useRemoveCartItem();
  const updateQty = useUpdateCartQuantity();
  const clearCart = useClearCart();

  // Per-item debounce: itemId → timer handle
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Per-item snapshot: captured BEFORE the first tap in a rapid sequence for correct rollback
  const snapshots = useRef<Record<string, typeof items>>({});

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

      const { items: currentItems, updateQuantityLocally, setCart, cartId: cId, storeId: sId } =
        useCartStore.getState();

      // 1. Save snapshot only on the FIRST tap of a rapid sequence
      if (!debounceTimers.current[itemId]) {
        snapshots.current[itemId] = currentItems;
      }

      // 2. Update UI instantly — no waiting for the network
      updateQuantityLocally(itemId, quantity);

      // 3. Reset the debounce timer for this specific item
      clearTimeout(debounceTimers.current[itemId]);
      debounceTimers.current[itemId] = setTimeout(() => {
        const snapshot = snapshots.current[itemId];
        delete debounceTimers.current[itemId];
        delete snapshots.current[itemId];

        // 4. Fire ONE request with the final quantity after 600ms of inactivity
        updateQty.mutate(
          { itemId, quantity },
          {
            onError: () => {
              // 5. Rollback to the pre-sequence state on failure
              if (snapshot && cId && sId) {
                setCart(cId, sId, snapshot);
              }
            },
          },
        );
      }, 600);
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
