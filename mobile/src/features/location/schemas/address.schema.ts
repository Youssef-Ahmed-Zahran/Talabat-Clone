import { z } from 'zod';

// ============================================================
// Address Schemas
// ============================================================

export const addressSchema = z.object({
  cityId: z.string().min(1, 'City is required'),
  type: z.enum(['APARTMENT', 'VILLA', 'OFFICE']),
  label: z.string().optional(),
  buildingName: z.string().optional(),
  apartmentNumber: z.string().optional(),
  floor: z.string().optional(),
  street: z.string().optional(),
  phone: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  isDefault: z.boolean().optional(),
});

export type AddressFormData = z.infer<typeof addressSchema>;
