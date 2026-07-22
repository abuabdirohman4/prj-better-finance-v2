# Plan: Goals Feature (bf-gol)

**Date:** 2026-07-22
**Issue:** bf-gol · P2 Feature
**Route:** `/goals`
**Scope:** Savings goals list + progress + CRUD bottom sheet

---

## Context

Schema `savings_goals`:
```
id, user_id, name, description, icon_name, goal_type (text, e.g. "Saving"/"Investing"),
linked_account_id (FK accounts, nullable), target_amount (numeric), monthly_contribution (numeric),
deadline_date (date), duration_label (text), collected_amount (numeric default 0),
retained_amount (numeric), is_active (boolean default true), created_at, updated_at
```

v1 groups goals by `goal_type` (Saving / Investing) dengan progress bar `collected_amount / target_amount`.
v2: sama — list grouped by goal_type, progress bar, CRUD.

`goalKeys` sudah ada di `src/lib/query.ts`: `goalKeys.all / .list() / .detail(id)`

---

## Files

```
src/db/queries/goals.ts                          ← NEW
src/lib/schemas/goal.ts                          ← NEW
src/app/(app)/goals/actions.ts                   ← NEW
src/app/(app)/goals/_hooks/useGoals.ts           ← NEW
src/app/(app)/goals/_components/GoalCard.tsx     ← NEW
src/app/(app)/goals/_components/GoalBottomSheet.tsx ← NEW
src/app/(app)/goals/page.tsx                     ← REPLACE stub
```

---

## Task 1 — Drizzle Query (`src/db/queries/goals.ts`)

```ts
import { and, eq, desc } from "drizzle-orm";
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
```

Import `sql` dari `drizzle-orm`.

---

## Task 2 — Zod Schema (`src/lib/schemas/goal.ts`)

```ts
import { z } from "zod";

export const goalTypeSchema = z.enum(["Saving", "Investing"]);

export const createGoalSchema = z.object({
  name: z.string().min(1, "Nama goal wajib diisi").max(100),
  description: z.string().max(200).optional().nullable(),
  goal_type: goalTypeSchema,
  target_amount: z.number().positive("Target harus lebih dari 0"),
  monthly_contribution: z.number().positive().optional().nullable(),
  deadline_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  linked_account_id: z.string().uuid().optional().nullable(),
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  collected_amount: z.number().min(0).optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
```

---

## Task 3 — Server Actions (`src/app/(app)/goals/actions.ts`)

Pattern sama dengan budgets actions:
- `getGoalsAction()` → `ServerActionResult<GoalRow[]>`
- `createGoalAction(input)` → zod safeParse → `createGoal` → `{ id }`
- `updateGoalAction(goalId, input)` → UUID check + zod safeParse → `updateGoal`
- `deleteGoalAction(goalId)` → UUID check → `softDeleteGoal`
- Guard: `linked_account_id` ownership check via `getAccountById` jika ada

---

## Task 4 — Hook (`src/app/(app)/goals/_hooks/useGoals.ts`)

```ts
useGoals() → { query, createMutation, updateMutation, deleteMutation }
queryKey: goalKeys.list()
invalidate: goalKeys.all setelah tiap mutation
```

---

## Task 5 — GoalCard (`src/app/(app)/goals/_components/GoalCard.tsx`)

```tsx
function getGoalColors(percent: number) {
  if (percent >= 100) return { bar: "bg-green-500", badge: "bg-green-100 text-green-700" };
  if (percent >= 80)  return { bar: "bg-blue-500",  badge: "bg-blue-100 text-blue-700" };
  if (percent >= 50)  return { bar: "bg-amber-400", badge: "bg-amber-100 text-amber-700" };
  return { bar: "bg-red-500", badge: "bg-red-100 text-red-700" };
}
```

Display: nama, goal_type badge, progress bar, `collected / target`, % badge, deadline jika ada.
Tap → onEdit(goal).

---

## Task 6 — GoalBottomSheet (`src/app/(app)/goals/_components/GoalBottomSheet.tsx`)

Fields:
- Nama (Input)
- Tipe (SingleSelect: Saving / Investing)
- Target Amount (Input number, format Rp)
- Kontribusi Bulanan (Input number, optional)
- Deadline (Input type date, optional)
- Akun terhubung (SingleSelect dari accounts list, optional)

Edit mode tambah: Terkumpul field (collected_amount) + Delete button.

Animasi: sama dengan BudgetBottomSheet (`translate(-50%, 0/100%)`).

---

## Task 7 — Page (`src/app/(app)/goals/page.tsx`)

- Header gradient + wave (copy dari dashboard)
- Group by `goal_type` (Saving / Investing)
- Summary: total target vs total terkumpul
- Loading skeleton, empty state
- FAB → create sheet
- `<GoalCard>` per goal → edit sheet

---

## Verifikasi

1. `/goals` render, empty state muncul
2. FAB → buat goal "Dana Darurat", Saving, Rp 10jt → card muncul, progress 0%
3. Edit goal → ubah collected_amount → progress bar update
4. Delete → goal hilang
5. `hideBalances` → semua angka sensor

## CLAUDE.md Check
- [ ] Pattern sama dengan budgets — tidak ada yang baru di AGENTS.md
