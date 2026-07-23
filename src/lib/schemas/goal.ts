import { z } from "zod";

export const goalTypeSchema = z.enum(["Saving", "Investment"]);

export const createGoalSchema = z.object({
  name: z.string().min(1, "Nama goal wajib diisi").max(100),
  description: z.string().max(200).optional().nullable(),
  goal_type: goalTypeSchema,
  target_amount: z.number().positive("Target harus lebih dari 0"),
  monthly_contribution: z.number().positive().optional().nullable(),
  deadline_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  collected_amount: z.number().min(0).optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
