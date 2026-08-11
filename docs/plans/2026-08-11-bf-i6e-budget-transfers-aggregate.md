# bf-i6e — Budget Transfers Aggregate Section

**Date:** 2026-08-11
**Issue:** bf-i6e
**Replaces:** bf-yz4 saving budget (per-goal) — redesign ke 2 aggregate bucket

---

## Context

Saving budget section yang ada (bf-yz4) tampil per-goal individual — semua goals muncul sekaligus.
User ingin ganti ke 2 aggregate bucket mirip spreadsheet:
- **Saving**: target alokasi nabung bulan ini
- **Investing**: target alokasi invest bulan ini

Actual = SUM transfer transactions bulan itu, di-split berdasarkan goal_type.
Budget target = user set manual (disimpan di tabel budgets, pakai 2 kategori virtual).

---

## Design

```
Budget Transfers
  Saving    Budget: 2jt  | Actual: 1,9jt | 95%
  Investing Budget: 500k | Actual: 342k  | 68%
```

2 baris. Tap → buka BudgetBottomSheet untuk set target.

---

## Tasks

### Task 1 — Re-activate Saving + Investment categories via MCP SQL

```sql
UPDATE categories
SET is_active = true
WHERE user_id = '321d6292-f86d-4807-96fa-df1dc5e130ac'
  AND name IN ('Saving', 'Investment');
```

Verify: `SELECT name, group_name, is_active FROM categories WHERE name IN ('Saving', 'Investment');`

Note: Kedua kategori ini group_name = 'saving' / 'investing'. Pastikan tidak muncul di spending transaction picker — cek `getCategories` di `src/db/queries/accounts.ts`, kalau perlu filter `group_name NOT IN ('saving','investing')` di query itu.

### Task 2 — Add `getTransferBudgets` + `TransferBudgetRow` to budgets.ts

**File:** `src/db/queries/budgets.ts`

Add these exports:

```ts
export interface TransferBudgetRow {
  type: "saving" | "investing";
  label: string;
  category_id: string;
  budgeted_amount: number;
  actual_amount: number;
  percent: number;
}

export async function getTransferBudgets(
  userId: string,
  year: number,
  month: number
): Promise<TransferBudgetRow[]> {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

  // Budget targets from budgets table (Saving + Investing categories)
  const budgetRows = await db
    .select({
      group_name: categories.group_name,
      category_id: budgets.category_id,
      budgeted_amount: sql<number>`${budgets.budgeted_amount}::numeric`,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.category_id, categories.id))
    .where(
      and(
        eq(budgets.user_id, userId),
        eq(budgets.budget_year, year),
        eq(budgets.budget_month, month),
        inArray(categories.group_name, ["saving", "investing"]),
      )
    );

  const budgetMap = new Map(budgetRows.map(r => [r.group_name, r]));

  // Category IDs for Saving + Investing
  const catRows = await db
    .select({ id: categories.id, group_name: categories.group_name })
    .from(categories)
    .where(
      and(
        eq(categories.user_id, userId),
        inArray(categories.group_name, ["saving", "investing"]),
        eq(categories.is_active, true),
      )
    );
  const catMap = new Map(catRows.map(r => [r.group_name, r.id]));

  // Actual: SUM transfers grouped by goal_type
  const transferActual = await db
    .select({
      goal_type: savingsGoals.goal_type,
      total: sql<number>`SUM(${transactions.amount}::numeric)`,
    })
    .from(transactions)
    .innerJoin(savingsGoals, eq(transactions.goal_id, savingsGoals.id))
    .where(
      and(
        eq(transactions.user_id, userId),
        eq(transactions.transaction_type, "transfer"),
        isNotNull(transactions.goal_id),
        isNull(transactions.deleted_at),
        sql`${transactions.transaction_date} >= ${startDate}`,
        sql`${transactions.transaction_date} <= ${endDate}`,
      )
    )
    .groupBy(savingsGoals.goal_type);

  // goal_type "Saving" → "saving", goal_type "Investment" → "investing"
  const actualMap = new Map(
    transferActual.map(r => [
      r.goal_type === "Saving" ? "saving" : "investing",
      Number(r.total),
    ])
  );

  const BUCKETS: { type: "saving" | "investing"; label: string; groupName: string }[] = [
    { type: "saving", label: "Saving", groupName: "saving" },
    { type: "investing", label: "Investing", groupName: "investing" },
  ];

  return BUCKETS.map(({ type, label, groupName }) => {
    const budgeted = budgetMap.get(groupName)?.budgeted_amount ?? 0;
    const actual = actualMap.get(type) ?? 0;
    return {
      type,
      label,
      category_id: catMap.get(groupName) ?? "",
      budgeted_amount: budgeted,
      actual_amount: actual,
      percent: budgeted > 0 ? (actual / budgeted) * 100 : 0,
    };
  });
}
```

Additional imports needed in budgets.ts: `savingsGoals` from `@/db/schema`, `isNotNull`, `isNull`.

### Task 3 — Update actions.ts

**File:** `src/app/(app)/budgets/actions.ts`

Replace `getSavingBudgetsAction` with:

```ts
import { getTransferBudgets, type TransferBudgetRow } from "@/db/queries/budgets";

export async function getTransferBudgetsAction(
  year: number,
  month: number
): Promise<ServerActionResult<TransferBudgetRow[]>> {
  try {
    const user = await requireUser();
    const data = await getTransferBudgets(user.id, year, month);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}
```

Remove old `getSavingBudgets` + `SavingBudgetRow` imports.

### Task 4 — Update useBudgets hook

**File:** `src/app/(app)/budgets/_hooks/useBudgets.ts`

```ts
import { getTransferBudgetsAction } from "../actions";

const transferQuery = useQuery({
  queryKey: budgetKeys.saving(year, month),
  queryFn: async () => {
    const res = await getTransferBudgetsAction(year, month);
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },
  staleTime: 30_000,
});
```

Return `transferQuery` (rename from `savingQuery`).

### Task 5 — Redesign SavingBudgetSection component

**File:** `src/app/(app)/budgets/_components/SavingBudgetSection.tsx`

Replace entire file:

```tsx
"use client";
import { Wallet, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/helper";
import type { TransferBudgetRow } from "@/db/queries/budgets";

interface Props {
  items: TransferBudgetRow[];
  hideBalances: boolean;
  onSetBudget?: (item: TransferBudgetRow) => void;
}

const MASK = "Rp •••";

export function SavingBudgetSection({ items, hideBalances, onSetBudget }: Props) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-900 text-lg">Budget Transfers</h2>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 space-y-2">
        {items.map(item => {
          const barWidth = Math.min(item.percent, 100);
          const remaining = item.budgeted_amount - item.actual_amount;
          const isGood = item.percent >= 100;
          return (
            <button
              key={item.type}
              onClick={() => onSetBudget?.(item)}
              className="w-full text-left bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 hover:border-blue-100 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                    {item.type === "saving"
                      ? <Wallet className="w-5 h-5" />
                      : <TrendingUp className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-800 block mb-0.5">{item.label}</span>
                    <span className="text-[11px] text-gray-500 block">
                      {hideBalances ? MASK : `${formatCurrency(item.actual_amount)} / ${formatCurrency(item.budgeted_amount)}`}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {item.budgeted_amount === 0 ? (
                    <span className="text-xs text-blue-500 font-medium">Set budget</span>
                  ) : (
                    <span className="font-bold text-sm text-gray-900 block">
                      {hideBalances ? MASK : formatCurrency(remaining > 0 ? remaining : 0)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isGood ? "bg-green-500" : "bg-blue-500"}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className={`text-[11px] font-bold ${isGood ? "text-green-600" : "text-blue-600"} min-w-[32px] text-right`}>
                  {item.percent.toFixed(0)}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

### Task 6 — Update page.tsx

**File:** `src/app/(app)/budgets/page.tsx`

```tsx
const { query, incomeQuery, transferQuery, categoriesQuery, upsertMutation, deleteMutation } = useBudgets(year, month);
const transferBudgets = transferQuery.data ?? [];
```

Update SavingBudgetSection render:
```tsx
{!query.isLoading && (
  <SavingBudgetSection
    items={transferBudgets}
    hideBalances={hideBalances}
    onSetBudget={(item) => {
      // Pre-select category in BudgetBottomSheet
      // Find budget row by category_id or open with category pre-set
      // For now: open sheet with no pre-selection (user picks from dropdown)
      openCreate();
    }}
  />
)}
```

---

## Files Changed

| File | Perubahan |
|---|---|
| DB via MCP | Re-activate Saving + Investment categories |
| `src/db/queries/budgets.ts` | Add `getTransferBudgets` + `TransferBudgetRow` |
| `src/app/(app)/budgets/actions.ts` | Replace getSavingBudgetsAction |
| `src/app/(app)/budgets/_hooks/useBudgets.ts` | Rename to transferQuery |
| `src/app/(app)/budgets/_components/SavingBudgetSection.tsx` | Full redesign |
| `src/app/(app)/budgets/page.tsx` | Update props/names |

6 files → **Mode A (Antigravity)**

---

## CLAUDE.md Check
- [ ] Pattern baru: Transfer budget = 2 aggregate bucket by goal_type → tambah ke AGENTS.md
- [ ] Tidak ada tabel/schema baru
- [ ] Update AGENTS.md setelah implementasi
