# Plan: Budgets Feature (bf-n43)

**Date:** 2026-07-22
**Issue:** bf-n43 · P2 Feature
**Route:** `/budgets`
**Scope:** Monthly budget per category — list, CRUD bottom sheet, progress bar vs actual spending

---

## Context

Schema `budgets` sudah ada di DB:
```
budgets: id, user_id, budget_year (smallint), budget_month (smallint),
         category_id, budgeted_amount (numeric), note, created_at, updated_at
UNIQUE(user_id, budget_year, budget_month, category_id)
```

v1 budgets pakai Google Sheets sebagai data source dengan parser kompleks. v2 langsung ke DB via Drizzle.
Fitur inti v2: list budget per bulan, progress bar (budgeted vs actual spending dari `transactions`), CRUD (upsert per category).

`budgetKeys` sudah ada di `src/lib/query.ts`:
```ts
budgetKeys.all / budgetKeys.monthly(year, month) / budgetKeys.withSpending(year, month)
```

Categories sudah ada: `getCategories(userId)` di `src/db/queries/accounts.ts` — group_name field (`eating`, `living`, `saving`, `investing`, `giving`).

---

## Files yang Dibuat / Diubah

```
src/db/queries/budgets.ts                         ← NEW: Drizzle queries
src/lib/schemas/budget.ts                         ← NEW: zod schema
src/app/(app)/budgets/actions.ts                  ← NEW: Server Actions
src/app/(app)/budgets/_hooks/useBudgets.ts        ← NEW: TanStack hook
src/app/(app)/budgets/_components/BudgetCard.tsx  ← NEW: card per category
src/app/(app)/budgets/_components/BudgetBottomSheet.tsx ← NEW: CRUD bottom sheet
src/app/(app)/budgets/page.tsx                    ← REPLACE: replace stub
```

---

## Task 1 — Drizzle Query Layer (`src/db/queries/budgets.ts`)

```ts
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
```

---

## Task 2 — Zod Schema (`src/lib/schemas/budget.ts`)

```ts
import { z } from "zod";

export const upsertBudgetSchema = z.object({
  category_id: z.string().uuid("Kategori tidak valid"),
  budget_year: z.number().int().min(2020).max(2100),
  budget_month: z.number().int().min(1).max(12),
  budgeted_amount: z.number().positive("Jumlah budget harus lebih dari 0"),
  note: z.string().max(200).optional().nullable(),
});

export type UpsertBudgetInput = z.infer<typeof upsertBudgetSchema>;
```

---

## Task 3 — Server Actions (`src/app/(app)/budgets/actions.ts`)

```ts
"use server";

import { requireUser } from "@/lib/accessControlServer";
import { handleApiError, type ServerActionResult } from "@/lib/errorUtils";
import {
  getBudgetsWithSpending,
  upsertBudget,
  deleteBudget,
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
    return { success: false, message: handleApiError(error, "memuat budget").message };
  }
}

export async function getCategoriesForBudgetAction(): Promise<ServerActionResult<CategoryRow[]>> {
  try {
    const user = await requireUser();
    const data = await getCategories(user.id);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat kategori").message };
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
    return { success: false, message: handleApiError(error, "menyimpan budget").message };
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
    return { success: false, message: handleApiError(error, "menghapus budget").message };
  }
}
```

---

## Task 4 — TanStack Hook (`src/app/(app)/budgets/_hooks/useBudgets.ts`)

```ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { budgetKeys } from "@/lib/query";
import {
  getBudgetsAction,
  upsertBudgetAction,
  deleteBudgetAction,
  getCategoriesForBudgetAction,
} from "../actions";
import type { UpsertBudgetInput } from "@/lib/schemas/budget";

export function useBudgets(year: number, month: number) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: budgetKeys.withSpending(year, month),
    queryFn: async () => {
      const res = await getBudgetsAction(year, month);
      if (!res.success) throw new Error(res.message);
      return res.data!;
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ["budget-categories"],
    queryFn: async () => {
      const res = await getCategoriesForBudgetAction();
      if (!res.success) throw new Error(res.message);
      return res.data!;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: (input: UpsertBudgetInput) => upsertBudgetAction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBudgetAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });

  return { query, categoriesQuery, upsertMutation, deleteMutation };
}
```

---

## Task 5 — BudgetCard Component (`src/app/(app)/budgets/_components/BudgetCard.tsx`)

```tsx
"use client";

import { formatCurrency } from "@/lib/helper";
import type { BudgetWithSpending } from "@/db/queries/budgets";

interface Props {
  budget: BudgetWithSpending;
  onEdit: (budget: BudgetWithSpending) => void;
  hideBalances: boolean;
}

function getBudgetColors(percent: number) {
  if (percent > 100) return { bar: "bg-red-500", text: "text-red-600", badge: "bg-red-100 text-red-700" };
  if (percent >= 80) return { bar: "bg-amber-400", text: "text-amber-600", badge: "bg-amber-100 text-amber-700" };
  return { bar: "bg-green-500", text: "text-green-600", badge: "bg-green-100 text-green-700" };
}

const MASK = "Rp •••.•••";

export function BudgetCard({ budget, onEdit, hideBalances }: Props) {
  const colors = getBudgetColors(budget.percent);
  const barWidth = Math.min(budget.percent, 100);

  return (
    <button
      onClick={() => onEdit(budget)}
      className="w-full text-left bg-white rounded-2xl shadow-sm border border-gray-100 p-4 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-800">{budget.category_name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
          {budget.percent.toFixed(0)}%
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all ${colors.bar}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>
          {hideBalances ? MASK : formatCurrency(budget.actual_spending)} terpakai
        </span>
        <span>
          dari {hideBalances ? MASK : formatCurrency(budget.budgeted_amount)}
        </span>
      </div>
    </button>
  );
}
```

---

## Task 6 — BudgetBottomSheet (`src/app/(app)/budgets/_components/BudgetBottomSheet.tsx`)

Bottom sheet untuk create/edit budget. Mirip pattern `TransactionBottomSheet.tsx`.

Props:
```ts
interface Props {
  open: boolean;
  onClose: () => void;
  categories: CategoryRow[];
  editBudget?: BudgetWithSpending | null;  // null = create mode
  year: number;
  month: number;
  onSuccess: () => void;
}
```

Fields:
- **Kategori** — `SingleSelect` dari `categories` (group_name sebagai optgroup)
- **Jumlah Budget** — `Input` type number, format Rp
- **Catatan** — `Input` optional

Validasi client: category_id required, amount > 0.

Submit → `upsertMutation.mutate(...)` → onSuccess → onClose.

Delete button (hanya edit mode): `deleteMutation.mutate(budget.id)` → onSuccess → onClose.

Animasi slide-up sama dengan bottom sheet lain:
```ts
// className: "fixed bottom-0 left-1/2 w-full max-w-md bg-white rounded-t-3xl z-50 shadow-2xl"
// style: { transform: open ? "translate(-50%, 0)" : "translate(-50%, 100%)", transition: "transform 0.3s ease" }
```
Backdrop: `fixed inset-0 bg-black/40 z-40`.

---

## Task 7 — Page (`src/app/(app)/budgets/page.tsx`)

Replace stub dengan full implementation:

```tsx
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useBudgets } from "./_hooks/useBudgets";
import { BudgetCard } from "./_components/BudgetCard";
import { BudgetBottomSheet } from "./_components/BudgetBottomSheet";
import { Fab } from "@/components/layouts/Fab";
import { usePrivacyStore } from "@/stores/privacyStore";
import { formatCurrency } from "@/lib/helper";
import type { BudgetWithSpending } from "@/db/queries/budgets";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export default function BudgetsPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<BudgetWithSpending | null>(null);
  const hideBalances = usePrivacyStore((s) => s.hideBalances);

  const { query, categoriesQuery, upsertMutation, deleteMutation } = useBudgets(year, month);

  const budgets = query.data ?? [];

  // Group by group_name (eating, living, saving, investing, giving)
  const groups = budgets.reduce<Record<string, BudgetWithSpending[]>>((acc, b) => {
    const g = b.group_name ?? "lainnya";
    if (!acc[g]) acc[g] = [];
    acc[g].push(b);
    return acc;
  }, {});

  const totalBudgeted = budgets.reduce((s, b) => s + b.budgeted_amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.actual_spending, 0);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  function openCreate() { setEditBudget(null); setSheetOpen(true); }
  function openEdit(b: BudgetWithSpending) { setEditBudget(b); setSheetOpen(true); }

  const MASK = "Rp •••.•••";

  return (
    <div className="bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden bg-linear-to-r from-blue-600 via-blue-700 to-indigo-800 px-6 py-7">
        <div className="absolute bottom-0 left-0 w-full h-8">
          <svg viewBox="0 0 400 32" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,32 Q100,20 200,32 T400,20 L400,32 Z" fill="rgb(249 250 251)" />
          </svg>
        </div>
        <div className="relative z-10">
          <h1 className="text-xl font-bold text-white mb-1">Budget</h1>
          {/* Month picker */}
          <div className="flex items-center gap-3 mt-2">
            <button onClick={prevMonth} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <span className="text-white font-medium">{MONTH_NAMES[month - 1]} {year}</span>
            <button onClick={nextMonth} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 pb-24 space-y-4">
        {/* Summary card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-gray-500 text-xs">Total Budget</p>
              <p className="font-semibold text-gray-800">{hideBalances ? MASK : formatCurrency(totalBudgeted)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs">Terpakai</p>
              <p className="font-semibold text-gray-800">{hideBalances ? MASK : formatCurrency(totalSpent)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs">Sisa</p>
              <p className={`font-semibold ${totalBudgeted - totalSpent < 0 ? "text-red-600" : "text-green-600"}`}>
                {hideBalances ? MASK : formatCurrency(totalBudgeted - totalSpent)}
              </p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {query.isLoading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="animate-pulse bg-white rounded-2xl h-20 shadow-sm" />)}
          </div>
        )}

        {/* Empty state */}
        {!query.isLoading && budgets.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <p className="text-gray-400 text-sm">Belum ada budget bulan ini.</p>
            <p className="text-gray-400 text-xs mt-1">Tap + untuk tambah budget per kategori.</p>
          </div>
        )}

        {/* Groups */}
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
              {group}
            </h2>
            <div className="space-y-2">
              {items.map(b => (
                <BudgetCard key={b.id} budget={b} onEdit={openEdit} hideBalances={hideBalances} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <Fab onClick={openCreate} label="Tambah budget" />

      <BudgetBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        categories={categoriesQuery.data ?? []}
        editBudget={editBudget}
        year={year}
        month={month}
        onSuccess={() => setSheetOpen(false)}
        upsertMutation={upsertMutation}
        deleteMutation={deleteMutation}
      />
    </div>
  );
}
```

---

## Verifikasi

```bash
pnpm dev
# Pre-warm: curl -sS -o /dev/null -w '%{http_code} %{time_total}s\n' http://localhost:3000/budgets
```

1. `/budgets` render header gradient + wave + month picker
2. Bulan kosong → empty state muncul
3. Tap FAB → bottom sheet slide-up, kategori list dari DB
4. Set budget Rp 500.000 untuk kategori → save → card muncul dengan progress bar hijau
5. Tap card → edit sheet, ubah amount → update benar
6. Delete → card hilang
7. Ada spending di bulan ini → progress bar update (% benar)
8. `hideBalances` toggle → semua angka tersensor

---

## CLAUDE.md Check
- [ ] Pattern baru? Tidak — sama persis dengan transactions pattern
- [ ] Tabel baru? Tidak — `budgets` sudah ada di schema
- [ ] Route baru? `/budgets` sudah ada di BottomNav
- [ ] Permission pattern baru? Tidak
- [ ] Jika ada yang perlu diupdate → update `AGENTS.md` setelah implementasi selesai
