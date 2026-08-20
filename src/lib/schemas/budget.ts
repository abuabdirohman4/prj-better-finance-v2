import { z } from "zod";

export const upsertBudgetSchema = z.object({
  category_id: z.string().uuid("Invalid category"),
  budget_year: z.number().int().min(2020).max(2100),
  budget_month: z.number().int().min(1).max(12),
  budgeted_amount: z.number().positive("Budget amount must be greater than 0"),
  note: z.string().max(200).optional().nullable(),
});

export type UpsertBudgetInput = z.infer<typeof upsertBudgetSchema>;
