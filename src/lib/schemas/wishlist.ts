import { z } from "zod";

export const createWishlistSchema = z.object({
  name: z.string().min(1, "Item name is required").max(100),
  description: z.string().max(200).optional().nullable(),
  url: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  estimated_price: z.number().positive("Price must be greater than 0"),
  priority: z.number().int().min(1).max(5).optional().default(3),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export const updateWishlistSchema = createWishlistSchema.partial().extend({
  status: z.enum(["active", "purchased", "cancelled"]).optional(),
});

export type CreateWishlistInput = z.infer<typeof createWishlistSchema>;
export type UpdateWishlistInput = z.infer<typeof updateWishlistSchema>;
