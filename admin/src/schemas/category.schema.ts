import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
