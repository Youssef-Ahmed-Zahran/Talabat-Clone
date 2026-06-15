import { z } from 'zod';

export const VEHICLE_TYPES = ['CAR', 'MOTORCYCLE', 'BICYCLE'] as const;
export const SHIRT_SIZES = ['MEDIUM', 'LARGE', 'XL'] as const;

export const personalInfoSchema = z.object({
  vehicleType: z.enum(VEHICLE_TYPES, { message: 'Select a vehicle type' }),
  firstName: z.string().min(1, 'First name is required'),
  familyName: z.string().min(1, 'Family name is required'),
  phone: z
    .string()
    .min(7, 'Enter a valid phone number')
    .regex(/^[0-9+\-\s()]+$/, 'Enter a valid phone number'),
  secondPhone: z.string().optional(),
  isOver18: z.boolean().refine((v) => v === true, {
    message: 'You must be 18 or older to apply',
  }),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  nationalId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  idNumber: z.string().optional(),
  idExpiryDate: z.string().optional(),
  residenceGovernorate: z.string().optional(),
  shirtSize: z.enum(SHIRT_SIZES).optional(),
  interestedInTobacco: z.boolean().optional(),
});

export const vehicleInfoSchema = z.object({
  vehiclePlateNumber: z.string().optional(),
  drivingLicenseExpiry: z.string().optional(),
  vehicleRegistrationExpiry: z.string().optional(),
});

export type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;
export type VehicleInfoFormValues = z.infer<typeof vehicleInfoSchema>;
