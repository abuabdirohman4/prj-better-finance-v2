import { z } from "zod";

export const createAccountSchema = z.object({
  name: z.string().min(1, "Account name is required").max(50),
  account_type_id: z.string().uuid("Invalid account type"),
  current_balance: z.number(),
  asset_category: z.enum(["liquid", "investment"]).default("liquid"),
  investment_group: z.string().trim().max(40).nullable().optional(),
  include_in_net_worth: z.boolean().default(true),
  is_wallet: z.boolean().default(false),
  is_liability: z.boolean().default(false),
  sort_order: z.number().int().default(0),
});

export const updateAccountSchema = createAccountSchema.partial();

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
