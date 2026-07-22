"use server";

import { requireUser } from "@/lib/accessControlServer";
import { handleApiError, type ServerActionResult } from "@/lib/errorUtils";
import {
  getBudgetsWithSpending,
  upsertBudget,
  deleteBudget,
  getTransactionsForWeeklyBudget,
  type BudgetWithSpending,
} from "@/db/queries/budgets";
import { getCategories, type CategoryRow } from "@/db/queries/accounts";
import { upsertBudgetSchema, type UpsertBudgetInput } from "@/lib/schemas/budget";
import { z } from "zod";

export async function getBudgetsAction(
  year: number,
  month: number
): Promise<ServerActionResult<BudgetWithSpending[]>> {
  try {
    const user = await requireUser();
    const data = await getBudgetsWithSpending(user.id, year, month);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}

export async function getCategoriesForBudgetAction(): Promise<ServerActionResult<CategoryRow[]>> {
  try {
    const user = await requireUser();
    const data = await getCategories(user.id);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}

export async function upsertBudgetAction(
  input: UpsertBudgetInput
): Promise<ServerActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = upsertBudgetSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }
    // Ownership guard: category_id harus milik user (getCategories sudah filter user_id)
    const cats = await getCategories(user.id);
    if (!cats.some((c) => c.id === parsed.data.category_id)) {
      return { success: false, message: "Kategori tidak valid." };
    }
    const id = await upsertBudget(user.id, parsed.data);
    return { success: true, data: { id } };
  } catch (error) {
    return { success: false, message: handleApiError(error, "menyimpan data").message };
  }
}

export async function deleteBudgetAction(
  budgetId: string
): Promise<ServerActionResult<void>> {
  try {
    const user = await requireUser();
    const parsed = z.string().uuid().safeParse(budgetId);
    if (!parsed.success) return { success: false, message: "ID budget tidak valid." };
    await deleteBudget(user.id, budgetId);
    return { success: true };
  } catch (error) {
    return { success: false, message: handleApiError(error, "menghapus data").message };
  }
}

export interface WeeklyTransactionRow {
  transaction_type: string;
  category_name: string;
  amount: number;
  transaction_date: string;
}

export async function getWeeklySpendingAction(
  year: number,
  month: number
): Promise<ServerActionResult<WeeklyTransactionRow[]>> {
  try {
    const user = await requireUser();
    const data = await getTransactionsForWeeklyBudget(user.id, year, month);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}
