# bf-yz4 — Budget Saving/Transfer: Target Nabung Per Goal

**Date:** 2026-08-11  
**Issue:** bf-yz4  
**Status:** Plan

---

## Context (dari beads bf-yz4)

Budget saat ini hanya untuk expense. User ingin **budget nabung** — target transfer ke goal per bulan.

Contoh: target nabung Dana Darurat 2jt/bln, DP Rumah 3jt/bln. Track realisasi: sudah transfer berapa ke goal ini bulan ini?

**Beda dari income budget (bf-4z1):**
- Income budget = target dapat income dari kategori earning
- Saving budget = target transfer ke goal (berapa dialokasikan ke tabungan)

**Relasi ke existing:**
- Transfer ke goal sudah ada (transaksi `transfer` ber-`goal_id`)
- `savings_goals.monthly_contribution` sudah ada di schema = target bulanan — ini bisa jadi "budget" nabung!
- Jadi: budget saving = SUM(transfer ber-`goal_id` + user) untuk bulan ini vs `monthly_contribution`

**Pendekatan minimal (tanpa tabel baru):**
- Manfaatkan `savings_goals.monthly_contribution` sebagai target bulanan
- Query aktual = SUM transfer dengan `goal_id` untuk bulan yang dipilih
- Tampil di `/budgets` sebagai section "Saving Budget" — per goal

---

## Design

```
[Budgets Page]
  [Overall Expense Progress Card]
  
  [Income Budget Section]  — dari bf-4z1

  [Saving Budget Section]  ← baru (bf-yz4)
    Goal: Dana Darurat  | Target: 2jt | Actual: 1,5jt | 75%
    Goal: DP Rumah      | Target: 3jt | Actual: 3jt   | 100% ✅
    Goal: Wisata        | Target: 500rb | Actual: 0   | 0%

  [Expense Budget Spending]
    ...
```

Progress bar saving = biru/hijau, makin besar makin baik (mirip income).

---

## Dependency

- bf-yz4 **tidak depend** on bf-btz (goal ledger) untuk implementasi dasar
- bf-btz **tidak depend** on bf-yz4
- bf-4z1 (income budget) dan bf-yz4 bisa di-plan parallel, tapi implementasi sebaiknya bf-4z1 dulu karena pattern yang sama bisa di-reuse

---

## Tasks

### Task 1 — Tambah `getSavingBudgets` query

**File:** `src/db/queries/goals.ts`

Query: per active goal yang punya `monthly_contribution`, hitung SUM transfer ber-goal_id bulan ini.

```ts
export interface SavingBudgetRow {
  goal_id: string;
  goal_name: string;
  goal_type: string;
  monthly_target: number;    // dari savings_goals.monthly_contribution
  actual_saved: number;      // SUM transfer ber-goal_id bulan ini
  percent: number;
}

export async function getSavingBudgets(
  userId: string,
  year: number,
  month: number
): Promise<SavingBudgetRow[]> {
  // Aktif goals yang punya monthly_contribution > 0
  const goals = await db
    .select({
      id: savingsGoals.id,
      name: savingsGoals.name,
      goal_type: savingsGoals.goal_type,
      monthly_contribution: sql<number>`${savingsGoals.monthly_contribution}::numeric`,
    })
    .from(savingsGoals)
    .where(
      and(
        eq(savingsGoals.user_id, userId),
        eq(savingsGoals.is_active, true),
        sql`${savingsGoals.monthly_contribution} > 0`,
      )
    )
    .orderBy(savingsGoals.goal_type, savingsGoals.name);

  if (goals.length === 0) return [];

  // SUM transfer per goal untuk bulan ini
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

  const transfers = await db
    .select({
      goal_id: transactions.goal_id,
      total: sql<number>`SUM(${transactions.amount}::numeric)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.user_id, userId),
        eq(transactions.transaction_type, "transfer"),
        isNotNull(transactions.goal_id),
        isNull(transactions.deleted_at),
        sql`${transactions.transaction_date} >= ${startDate}`,
        sql`${transactions.transaction_date} <= ${endDate}`,
        inArray(transactions.goal_id, goals.map(g => g.id)),
      )
    )
    .groupBy(transactions.goal_id);

  const transferMap = new Map(transfers.map(t => [t.goal_id, Number(t.total)]));

  return goals.map(g => {
    const actual = transferMap.get(g.id) ?? 0;
    const target = Number(g.monthly_contribution);
    return {
      goal_id: g.id,
      goal_name: g.name,
      goal_type: g.goal_type,
      monthly_target: target,
      actual_saved: actual,
      percent: target > 0 ? (actual / target) * 100 : 0,
    };
  });
}
```

**Import tambahan yang dibutuhkan:** `inArray`, `isNotNull`, `isNull`, `transactions` — cek yang sudah ada di imports file.

### Task 2 — Tambah `getSavingBudgetsAction`

**File:** `src/app/(app)/budgets/actions.ts`

```ts
import { getSavingBudgets, type SavingBudgetRow } from "@/db/queries/goals";

export async function getSavingBudgetsAction(
  year: number,
  month: number
): Promise<ServerActionResult<SavingBudgetRow[]>> {
  try {
    const user = await requireUser();
    const data = await getSavingBudgets(user.id, year, month);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}
```

### Task 3 — Update `useBudgets` hook — tambah savingQuery

**File:** `src/app/(app)/budgets/_hooks/useBudgets.ts`

```ts
const savingQuery = useQuery({
  queryKey: budgetKeys.saving(year, month),  // tambah key generator
  queryFn: async () => {
    const res = await getSavingBudgetsAction(year, month);
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },
  staleTime: 30_000,
});
```

Return `savingQuery` dari hook.

**File:** `src/lib/query.ts` — tambah `saving` ke `budgetKeys`:
```ts
saving: (year: number, month: number) => [...budgetKeys.all, "saving", year, month] as const,
```

### Task 4 — Buat `SavingBudgetSection` component

**File:** `src/app/(app)/budgets/_components/SavingBudgetSection.tsx` (baru)

```tsx
"use client";
import { formatCurrency } from "@/lib/helper";
import type { SavingBudgetRow } from "@/db/queries/goals";

interface Props {
  items: SavingBudgetRow[];
  hideBalances: boolean;
}

export function SavingBudgetSection({ items, hideBalances }: Props) {
  if (items.length === 0) return null;
  
  const totalTarget = items.reduce((s, i) => s + i.monthly_target, 0);
  const totalActual = items.reduce((s, i) => s + i.actual_saved, 0);
  const overallPercent = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
  const MASK = "Rp •••";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-base">Saving Budget</h2>
        <span className="text-xs text-blue-600 font-semibold">{overallPercent.toFixed(0)}%</span>
      </div>

      {/* Overall summary */}
      <div className="px-5 py-3 bg-blue-50/50 border-b border-gray-100">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Target: {hideBalances ? MASK : formatCurrency(totalTarget, "short")}</span>
          <span>Saved: {hideBalances ? MASK : formatCurrency(totalActual, "short")}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${Math.min(overallPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Per goal */}
      <div className="divide-y divide-gray-50">
        {items.map(item => (
          <div key={item.goal_id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-sm font-medium text-gray-800">{item.goal_name}</p>
              <p className="text-[10px] text-gray-400">{item.goal_type}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(item.percent, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8 text-right">{item.percent.toFixed(0)}%</span>
              </div>
              <span className="text-xs text-gray-400 mt-0.5 block">
                {hideBalances ? MASK : formatCurrency(item.actual_saved, "short")} / {hideBalances ? MASK : formatCurrency(item.monthly_target, "short")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Task 5 — Update `/budgets` page — tampilkan saving section

**File:** `src/app/(app)/budgets/page.tsx`

```tsx
const { query, incomeQuery, savingQuery, categoriesQuery, upsertMutation, deleteMutation } = useBudgets(year, month);
const savingBudgets = savingQuery.data ?? [];
```

Tambah `SavingBudgetSection` setelah `IncomeBudgetSection` (atau setelah Overall card jika bf-4z1 belum ada):

```tsx
{/* Saving Budget Section */}
{!query.isLoading && savingBudgets.length > 0 && (
  <SavingBudgetSection items={savingBudgets} hideBalances={hideBalances} />
)}
```

---

## Files Changed

| File | Perubahan |
|---|---|
| `src/db/queries/goals.ts` | Tambah `getSavingBudgets` + `SavingBudgetRow` |
| `src/app/(app)/budgets/actions.ts` | Tambah `getSavingBudgetsAction` |
| `src/app/(app)/budgets/_hooks/useBudgets.ts` | Tambah `savingQuery` |
| `src/lib/query.ts` | Tambah `budgetKeys.saving` |
| `src/app/(app)/budgets/_components/SavingBudgetSection.tsx` | Component baru |
| `src/app/(app)/budgets/page.tsx` | Integrate saving section |

Threshold: 6 files → **Mode A (Antigravity)**

---

## Notes

- `monthly_contribution` yang null/0 = goal tidak punya saving target → tidak muncul di saving budget section. User bisa update goal untuk set target bulanan.
- Tidak perlu CRUD UI baru untuk "saving budget" — edit via `/goals` page, set `monthly_contribution`.
- Kalau bf-4z1 diimplementasi duluan dan sudah update `useBudgets` + `query.ts`, executor cukup tambah `savingQuery` ke yang sudah ada.

---

## CLAUDE.md Check
- [ ] Pattern baru: Saving budget memanfaatkan `monthly_contribution` di `savings_goals` sebagai target — dokumentasikan di AGENTS.md
- [ ] Tidak ada tabel/schema baru
- [ ] Tidak ada route baru
- [ ] Update AGENTS.md setelah implementasi
