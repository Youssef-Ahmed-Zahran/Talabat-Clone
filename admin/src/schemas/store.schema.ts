import { z } from "zod";

export const storeSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  description: z.string().optional(),
  legalName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  mainCategoryId: z.string().optional(),
  storeType: z.string().min(1, "Store type is required"),
  deliveryType: z.enum(["TALABAT_DELIVERY", "STORE_DELIVERY", ""]),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  deliveryTimeMinutes: z.number().min(0).optional(),
  minimumOrderCost: z.number().min(0).optional(),
  deliveryFees: z.number().min(0).optional(),
  allowPreorder: z.boolean().optional(),
  ownerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  ownerPassword: z.string().optional(),
  logoUrl: z.string().optional(),
  coverImage: z.string().optional(),
  maxDeliveryDistanceKm: z.number().min(0).optional(),
  outsideZoneDeliveryFees: z.number().min(0).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
});

export type StoreFormValues = z.infer<typeof storeSchema>;
