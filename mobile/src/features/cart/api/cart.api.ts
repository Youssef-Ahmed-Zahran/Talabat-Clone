import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@src/config/axios";
import type {
  Cart,
  AddToCartRequest,
  UpdateCartItemQuantityRequest,
} from "@src/features/cart/types/cart.types";
import type { ApiResponse } from "@src/types/api.types";
import { useCartStore } from "@src/store/cartStore";

// ─── Get Cart ─────────────────────────────────────────────────
export const useCart = (storeId: string) => {
  const setCart = useCartStore((s) => s.setCart);

  return useQuery({
    queryKey: ["cart", storeId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Cart>>(`/carts/${storeId}`);
      const cart = res.data.data;
      if (cart) {
        setCart(cart.id, cart.storeId, cart.items || []);
      }
      return cart;
    },
    enabled: !!storeId,
  });
};

// ─── Add Item to Cart ─────────────────────────────────────────
export const useAddToCart = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddToCartRequest) => {
      const res = await api.post<ApiResponse<Cart>>("/carts/items", data);
      return res.data.data;
    },
    onSuccess: (cart) => {
      const { setCart } = useCartStore.getState();
      if (cart) {
        // The API now returns { id, storeId, items: [...] }
        setCart(cart.id, cart.storeId, cart.items || []);
      }
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};

// ─── Update Item Quantity ─────────────────────────────────────
export const useUpdateCartQuantity = () => {
  const qc = useQueryClient();
  const storeId = useCartStore((s) => s.storeId);

  return useMutation({
    mutationFn: async ({
      itemId,
      ...data
    }: UpdateCartItemQuantityRequest & { itemId: string }) => {
      const res = await api.patch<ApiResponse<Cart>>(
        `/carts/items/${itemId}/quantity`,
        { ...data, storeId },
      );
      return res.data.data;
    },
    // Sync server truth after the debounced call resolves
    onSuccess: (cart) => {
      const { setCart } = useCartStore.getState();
      if (cart) {
        setCart(cart.id, cart.storeId, cart.items || []);
      }
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};

// ─── Remove Item ──────────────────────────────────────────────
export const useRemoveCartItem = () => {
  const qc = useQueryClient();
  const storeId = useCartStore((s) => s.storeId);

  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await api.delete<ApiResponse<Cart>>(
        `/carts/items/${itemId}?storeId=${storeId}`,
      );
      return res.data.data;
    },
    onSuccess: (cart) => {
      const { setCart } = useCartStore.getState();
      if (cart) {
        setCart(cart.id, cart.storeId, cart.items || []);
      }
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};

// ─── Clear Cart ───────────────────────────────────────────────
export const useClearCart = () => {
  const qc = useQueryClient();
  const clearCartStore = useCartStore((s) => s.clearCart);

  return useMutation({
    mutationFn: async (cartId: string) => {
      await api.delete(`/carts/${cartId}`);
    },
    onSuccess: () => {
      clearCartStore();
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};
