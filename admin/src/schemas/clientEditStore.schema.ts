import { z } from "zod";

export const clientEditStoreSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  legalName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  overtimeOpenTime: z.string().optional(),
  overtimeCloseTime: z.string().optional(),
  deliveryTimeMinutes: z.coerce.number().min(0).optional(),
  minimumOrderCost: z.coerce.number().min(0).optional(),
  deliveryFees: z.coerce.number().min(0).optional(),
  maxDeliveryDistanceKm: z.coerce.number().min(1, "Minimum 1 km").max(50, "Maximum 50 km").optional(),
  allowPreorder: z.boolean().optional(),
  logoUrl: z.string().optional(),
  coverImage: z.string().optional(),
});

export type ClientEditStoreValues = z.infer<typeof clientEditStoreSchema>;

/** Maps a Store object to its form default values. Used in both defaultValues and reset(). */
export function getClientEditDefaults(store: {
  name?: string;
  description?: string | null;
  legalName?: string | null;
  phone?: string | null;
  email?: string | null;
  openTime?: string | null;
  closeTime?: string | null;
  overtimeOpenTime?: string | null;
  overtimeCloseTime?: string | null;
  deliveryTimeMinutes?: number | null;
  minimumOrderCost?: number | string | null;
  deliveryFees?: number | string | null;
  maxDeliveryDistanceKm?: number | string | null;
  allowPreorder?: boolean | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
}): ClientEditStoreValues {
  return {
    name: store.name || "",
    description: store.description || "",
    legalName: store.legalName || "",
    phone: store.phone || "",
    email: store.email || "",
    openTime: store.openTime || "09:00",
    closeTime: store.closeTime || "22:00",
    overtimeOpenTime: store.overtimeOpenTime || "",
    overtimeCloseTime: store.overtimeCloseTime || "",
    deliveryTimeMinutes: store.deliveryTimeMinutes || 30,
    minimumOrderCost: Number(store.minimumOrderCost) || 50,
    deliveryFees: Number(store.deliveryFees) || 15,
    maxDeliveryDistanceKm: Number(store.maxDeliveryDistanceKm) || 15,
    allowPreorder: store.allowPreorder ?? true,
    logoUrl: store.logoUrl || "",
    coverImage: store.coverUrl || "",
  };
}
