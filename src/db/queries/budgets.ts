import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { budgets, categories, transactions } from "@/db/schema";

export interface BudgetRow {
  id: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  group_name: string;
  budgeted_amount: number;
  note: string | null;
  budget_year: number;
  budget_month: number;
}

export interface BudgetWithSpending extends BudgetRow {
  actual_spending: number;
  percent: number; // actual / budgeted * 100
}

/** Semua budget rows untuk bulan tertentu */
export async function getBudgets(
  userId: string,
  year: number,
  month: number
): Promise<BudgetRow[]> {
  const rows = await db
    .select({
      id: budgets.id,
      category_id: budgets.category_id,
      category_name: categories.name,
      category_slug: categories.slug,
      group_name: categories.group_name,
      budgeted_amount: sql<number>`${budgets.budgeted_amount}::numeric`,
      note: budgets.note,
      budget_year: budgets.budget_year,
      budget_month: budgets.budget_month,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.category_id, categories.id))
    .where(
      and(
        eq(budgets.user_id, userId),
        eq(budgets.budget_year, year),
        eq(budgets.budget_month, month)
      )
    )
    .orderBy(categories.group_name, categories.sort_order);
  return rows;
}

/** Budget + actual spending dari transactions (spending type saja) */
export async function getBudgetsWithSpending(
  userId: string,
  year: number,
  month: number
): Promise<BudgetWithSpending[]> {
  const rows = await getBudgets(userId, year, month);
  if (rows.length === 0) return [];

  // Sum spending per category untuk bulan ini
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

  const spending = await db
    .select({
      category_id: transactions.category_id,
      total: sql<number>`sum(${transactions.amount})::numeric`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.user_id, userId),
        eq(transactions.transaction_type, "spending"),
        sql`${transactions.transaction_date} >= ${startDate}`,
        sql`${transactions.transaction_date} <= ${endDate}`,
        sql`${transactions.deleted_at} is null`,
        inArray(
          transactions.category_id,
          rows.map((r) => r.category_id)
        )
      )
    )
    .groupBy(transactions.category_id);

  const spendingMap = new Map(spending.map((s) => [s.category_id, s.total]));

  return rows.map((r) => {
    const actual = spendingMap.get(r.category_id) ?? 0;
    const percent = r.budgeted_amount > 0 ? (actual / r.budgeted_amount) * 100 : 0;
    return { ...r, actual_spending: actual, percent };
  });
}

/** Upsert satu budget (insert or update on conflict) */
export async function upsertBudget(
  userId: string,
  input: {
    category_id: string;
    budget_year: number;
    budget_month: number;
    budgeted_amount: number;
    note?: string | null;
  }
): Promise<string> {
  const result = await db
    .insert(budgets)
    .values({
      user_id: userId,
      category_id: input.category_id,
      budget_year: input.budget_year,
      budget_month: input.budget_month,
      budgeted_amount: String(input.budgeted_amount),
      note: input.note ?? null,
    })
    .onConflictDoUpdate({
      target: [budgets.user_id, budgets.budget_year, budgets.budget_month, budgets.category_id],
      set: {
        budgeted_amount: sql`excluded.budgeted_amount`,
        note: sql`excluded.note`,
        updated_at: sql`now()`,
      },
    })
    .returning({ id: budgets.id });
  return result[0].id;
}

/** Hapus budget row */
export async function deleteBudget(userId: string, budgetId: string): Promise<void> {
  await db
    .delete(budgets)
    .where(and(eq(budgets.id, budgetId), eq(budgets.user_id, userId)));
}
