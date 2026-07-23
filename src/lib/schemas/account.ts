import { z } from "zod";

export const createAccountSchema = z.object({
  name: z.string().min(1, "Nama akun wajib diisi").max(50),
  account_type_id: z.string().uuid("Tipe akun tidak valid"),
  current_balance: z.number(),
  asset_category: z.enum(["liquid", "investment"]).default("liquid"),
  include_in_net_worth: z.boolean(),
  sort_order: z.number(),
});

export const updateAccountSchema = createAccountSchema.partial();

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
