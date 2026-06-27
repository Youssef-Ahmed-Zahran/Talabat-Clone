import { z } from "zod";

export const subCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  image: z.string().optional(),
});

export type SubCategoryFormValues = z.infer<typeof subCategorySchema>;

export const linkStoreSchema = z.object({
  storeId: z.string().min(1, "Please select a store"),
});

export type LinkStoreFormValues = z.infer<typeof linkStoreSchema>;
