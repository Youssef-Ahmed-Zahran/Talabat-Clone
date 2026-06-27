import { z } from "zod";

export const sectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type SectionFormValues = z.infer<typeof sectionSchema>;

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  quantity: z.union([z.number().min(0), z.literal("")]).optional(),
  sectionId: z.string().optional(),
  secondarySectionIds: z.array(z.string()).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  primaryImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  optionGroups: z
    .array(
      z.object({
        name: z.string().min(1, "Group name is required"),
        isRequired: z.boolean().optional(),
        minSelect: z.number().optional(),
        maxSelect: z.number().optional(),
        sortOrder: z.number().optional(),
        values: z
          .array(
            z.object({
              name: z.string().min(1, "Option name is required"),
              extraPrice: z.number().optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
