import { z } from "zod";

export const upsertCategorySchema = z.object({
  id: z.string().uuid().optional(), // absent = create, present = update
  name: z.string().trim().min(1, "Category name is required").max(60),
  group_name: z.string().trim().min(1, "Group is required").max(40),
});

export type UpsertCategoryInput = z.infer<typeof upsertCategorySchema>;
