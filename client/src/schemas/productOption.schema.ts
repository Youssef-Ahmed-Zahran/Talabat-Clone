import { z } from "zod";

export const optionGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isRequired: z.boolean().optional(),
  minSelect: z.number().min(0).optional(),
  maxSelect: z.number().min(1).optional(),
});

export type OptionGroupFormValues = z.infer<typeof optionGroupSchema>;

export const optionValueSchema = z.object({
  name: z.string().min(1, "Name is required"),
  extraPrice: z.number().min(0).optional(),
});

export type OptionValueFormValues = z.infer<typeof optionValueSchema>;
