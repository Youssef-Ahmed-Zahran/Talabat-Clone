import { useQuery } from '@tanstack/react-query';
import api from '@src/config/axios';
import type { ApiResponse } from '@src/types/api.types';
import type { PlaceOrderRequest } from '@src/features/orders/types/order.types';

// ─── Get Checkout Summary (reuses cart + address + payment) ───
// This is a convenience hook that aggregates the data needed for checkout
export const useCheckoutData = (storeId: string) => {
  return useQuery({
    queryKey: ['checkout', storeId],
    queryFn: async () => {
      const [cartRes, methodsRes] = await Promise.all([
        api.get<ApiResponse<any>>(`/carts/${storeId}`),
        api.get<ApiResponse<any>>(`/payments/stores/${storeId}/methods`),
      ]);
      return {
        cart: cartRes.data.data,
        paymentMethods: methodsRes.data.data,
      };
    },
    enabled: !!storeId,
  });
};
