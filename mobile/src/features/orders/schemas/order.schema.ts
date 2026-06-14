import { z } from 'zod';

// ============================================================
// Order Schemas
// ============================================================

export const placeOrderSchema = z.object({
  storeId: z.string().min(1, 'Store is required'),
  addressId: z.string().min(1, 'Delivery address is required'),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  deliveryInstructions: z.string().optional(),
  tipAmount: z.number().min(0).optional(),
  scheduledTime: z.string().optional(),
});

export type PlaceOrderFormData = z.infer<typeof placeOrderSchema>;
