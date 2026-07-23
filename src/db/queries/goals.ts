import { and, eq, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { savingsGoals, accounts } from "@/db/schema";

export interface GoalRow {
  id: string;
  name: string;
  description: string | null;
  goal_type: string;
  target_amount: number;
  collected_amount: number;
  monthly_contribution: number | null;
  deadline_date: string | null;
  duration_label: string | null;
  linked_account_id: string | null;
  linked_account_name: string | null;
  is_active: boolean;
  percent: number; // collected / target * 100
}

export async function getGoals(userId: string): Promise<GoalRow[]> {
  const rows = await db
    .select({
      id: savingsGoals.id,
      name: savingsGoals.name,
      description: savingsGoals.description,
      goal_type: savingsGoals.goal_type,
      target_amount: sql<number>`${savingsGoals.target_amount}::numeric`,
      collected_amount: sql<number>`${savingsGoals.collected_amount}::numeric`,
      monthly_contribution: sql<number>`${savingsGoals.monthly_contribution}::numeric`,
      deadline_date: savingsGoals.deadline_date,
      duration_label: savingsGoals.duration_label,
      linked_account_id: savingsGoals.linked_account_id,
      linked_account_name: accounts.name,
      is_active: savingsGoals.is_active,
    })
    .from(savingsGoals)
    .leftJoin(accounts, eq(savingsGoals.linked_account_id, accounts.id))
    .where(and(eq(savingsGoals.user_id, userId), eq(savingsGoals.is_active, true)))
    .orderBy(savingsGoals.goal_type, desc(savingsGoals.collected_amount));

  return rows.map((r) => ({
    ...r,
    percent: r.target_amount > 0 ? (r.collected_amount / r.target_amount) * 100 : 0,
  }));
}

export async function createGoal(
  userId: string,
  input: {
    name: string;
    description?: string | null;
    goal_type: string;
    target_amount: number;
    monthly_contribution?: number | null;
    deadline_date?: string | null;
    linked_account_id?: string | null;
  }
): Promise<string> {
  const result = await db
    .insert(savingsGoals)
    .values({
      user_id: userId,
      name: input.name,
      description: input.description ?? null,
      goal_type: input.goal_type,
      target_amount: String(input.target_amount),
      monthly_contribution: input.monthly_contribution ? String(input.monthly_contribution) : null,
      deadline_date: input.deadline_date ?? null,
      linked_account_id: input.linked_account_id ?? null,
    })
    .returning({ id: savingsGoals.id });
  return result[0].id;
}

export async function updateGoal(
  userId: string,
  goalId: string,
  input: Partial<{
    name: string;
    description: string | null;
    goal_type: string;
    target_amount: number;
    monthly_contribution: number | null;
    deadline_date: string | null;
    collected_amount: number;
    linked_account_id: string | null;
  }>
): Promise<void> {
  const set: Record<string, unknown> = { updated_at: sql`now()` };
  if (input.name !== undefined) set.name = input.name;
  if (input.description !== undefined) set.description = input.description;
  if (input.goal_type !== undefined) set.goal_type = input.goal_type;
  if (input.target_amount !== undefined) set.target_amount = String(input.target_amount);
  if (input.monthly_contribution !== undefined)
    set.monthly_contribution = input.monthly_contribution ? String(input.monthly_contribution) : null;
  if (input.deadline_date !== undefined) set.deadline_date = input.deadline_date;
  if (input.collected_amount !== undefined) set.collected_amount = String(input.collected_amount);
  if (input.linked_account_id !== undefined) set.linked_account_id = input.linked_account_id;

  await db
    .update(savingsGoals)
    .set(set)
    .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.user_id, userId)));
}

export async function softDeleteGoal(userId: string, goalId: string): Promise<void> {
  await db
    .update(savingsGoals)
    .set({ is_active: false, updated_at: sql`now()` })
    .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.user_id, userId)));
}
