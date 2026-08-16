# bf-i6e — Savings Section Redesign

**Date:** 2026-08-16
**Issue:** bf-i6e
**Replaces plan:** `2026-08-11-bf-i6e-budget-transfers-aggregate.md` (superseded)

---

## Context

Plan lama (2026-08-11) membuat 2 aggregate bucket "Saving" / "Investing" berbasis kategori virtual.
Setelah diskusi, desain berubah: tampilkan **goal individual** langsung di section Savings, auto-hide
yang sudah selesai, dan sembunyikan dari budget spending picker.

Implementasi saat ini di production = plan lama sudah ter-implement (Budget Transfers + 2 bucket).
Plan ini **mengganti** implementasi itu.

---

## Design Final

```
Savings                          [Show all]  ← toggle muncul kalau ada yang di-hide
  ┌─────────────────────────────────────────┐
  │ 🏠  Dana Darurat     1,9jt / 5jt   38% │
  │ ✈️  Liburan Bali     750k / 2jt    37% │
  │ 📱  HP Baru          500k / 1,5jt  33% │
  └─────────────────────────────────────────┘
```

- **Header:** "Savings" (bukan "Budget Transfers")
- **Items:** goal individual dari `getGoals` (active, collected < target)
- **Auto-hide:** goal dengan `collected_amount >= target_amount` tidak tampil by default
- **Toggle "Show all":** muncul di header kalau ada goal yang di-hide; klik → tampilkan semua
- **Section terpisah** dari Budget Spending (tidak berubah)
- Tap goal → navigasi ke `/goals` (tidak ada drill-down khusus di sini)
- Tidak ada "Set budget" / kategori virtual saving/investing

---

## Data Source

Gunakan **`getGoals`** yang sudah ada di `src/db/queries/goals.ts`:

```ts
export interface GoalRow {
  id: string;
  name: string;
  goal_type: string;          // "Saving" | "Investment" | "Emergency" dll
  target_amount: number;
  collected_amount: number;
  percent: number;
  is_active: boolean;
  // ...
}
```

`getGoals` sudah hitung `collected_amount` derived (base + transfer − spending). Tidak perlu query baru.

Filter di client:
- `is_active === true` (sudah di-filter di query)
- Hide kalau `collected_amount >= target_amount` (unless `showAll` toggle aktif)

---

## Tasks

### Task 1 — Tambah server action `getSavingsGoalsAction`

**File:** `src/app/(app)/budgets/actions.ts`

Import `getGoals` dari goals query (sudah ada). Tambah action baru:

```ts
import { getGoals } from "@/db/queries/goals";
import type { GoalRow } from "@/db/queries/goals";

export async function getSavingsGoalsAction(): Promise<ServerActionResult<GoalRow[]>> {
  try {
    const user = await requireUser();
    const data = await getGoals(user.id);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "loading savings").message };
  }
}
```

Note: `getGoals` sudah filter `is_active = true`. Filter `collected >= target` dilakukan di component.

### Task 2 — Tambah `savingsQuery` ke `useBudgets`

**File:** `src/app/(app)/budgets/_hooks/useBudgets.ts`

```ts
import { getSavingsGoalsAction } from "../actions";
import type { GoalRow } from "@/db/queries/goals";

// Di dalam useBudgets():
const savingsQuery = useQuery({
  queryKey: ["budget-savings-goals"],
  queryFn: async () => {
    const res = await getSavingsGoalsAction();
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },
  staleTime: 30_000,
});

// Tambah ke return:
return {
  query,
  incomeQuery,
  transferQuery,   // keep — belum hapus, mungkin masih dipakai
  savingsQuery,    // new
  categoriesQuery,
  upsertMutation,
  deleteMutation,
};
```

### Task 3 — Rewrite `SavingBudgetSection.tsx`

**File:** `src/app/(app)/budgets/_components/SavingBudgetSection.tsx`

Replace entire file:

```tsx
"use client";

import { useState } from "react";
import { PiggyBank } from "lucide-react";
import { formatCurrency } from "@/lib/helper";
import type { GoalRow } from "@/db/queries/goals";

interface Props {
  goals: GoalRow[];
  hideBalances: boolean;
}

const MASK = "Rp •••";

export function SavingBudgetSection({ goals, hideBalances }: Props) {
  const [showAll, setShowAll] = useState(false);

  const activeGoals = goals.filter((g) => g.is_active);
  const completedGoals = activeGoals.filter(
    (g) => g.collected_amount >= g.target_amount
  );
  const visibleGoals = showAll
    ? activeGoals
    : activeGoals.filter((g) => g.collected_amount < g.target_amount);

  if (activeGoals.length === 0) return null;

  const hasHidden = completedGoals.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-900 text-lg">Savings</h2>
        {hasHidden && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-xs text-blue-500 font-medium"
          >
            {showAll ? "Hide completed" : `Show all (${completedGoals.length} done)`}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {visibleGoals.map((goal) => {
          const barWidth = Math.min(goal.percent, 100);
          const remaining = goal.target_amount - goal.collected_amount;
          const isDone = goal.collected_amount >= goal.target_amount;
          return (
            <div
              key={goal.id}
              className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0">
                    <PiggyBank className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-800 block mb-0.5">
                      {goal.name}
                    </span>
                    <span className="text-[11px] text-gray-500 block">
                      {hideBalances
                        ? MASK
                        : `${formatCurrency(goal.collected_amount)} / ${formatCurrency(goal.target_amount)}`}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {isDone ? (
                    <span className="text-xs text-green-500 font-medium">Done ✓</span>
                  ) : (
                    <span className="font-bold text-sm text-gray-900 block">
                      {hideBalances ? MASK : formatCurrency(remaining)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isDone ? "bg-green-500" : "bg-blue-500"}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span
                  className={`text-[11px] font-bold ${isDone ? "text-green-600" : "text-blue-600"} min-w-[32px] text-right`}
                >
                  {goal.percent.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Task 4 — Update `page.tsx`

**File:** `src/app/(app)/budgets/page.tsx`

```tsx
// Destructure tambah savingsQuery:
const { query, incomeQuery, transferQuery, savingsQuery, categoriesQuery, upsertMutation, deleteMutation } = useBudgets(year, month);
const savingsGoals = savingsQuery.data ?? [];

// Ganti render SavingBudgetSection:
{!savingsQuery.isLoading && (
  <SavingBudgetSection
    goals={savingsGoals}
    hideBalances={hideBalances}
  />
)}
```

Remove props lama (`items`, `onSetBudget`) dari render — component tidak butuh itu lagi.

---

## Files Changed

| File | Perubahan |
|---|---|
| `src/app/(app)/budgets/actions.ts` | Tambah `getSavingsGoalsAction` (import `getGoals`) |
| `src/app/(app)/budgets/_hooks/useBudgets.ts` | Tambah `savingsQuery` |
| `src/app/(app)/budgets/_components/SavingBudgetSection.tsx` | Full rewrite |
| `src/app/(app)/budgets/page.tsx` | Update destructure + render props |

4 files → **Mode B (direct)** — threshold <3 files substantial change, tapi 4 file semua kecil/mekanis.
Estimasi: ~100 lines perubahan net. Antigravity atau direct sama-sama OK.

---

## What NOT Changed

- `getTransferBudgets` di `budgets.ts` — tidak dihapus (mungkin masih dipakai oleh `transferQuery`)
- `TransferBudgetRow` type — keep untuk backward compat
- Budget Spending section — tidak bersentuh
- `BudgetDrillSheet` — tidak bersentuh
- Tap goal di Savings section → tidak ada drill-down (cukup static, navigasi ke /goals jika perlu)

---

## Verify

- [ ] Savings section tampil goal individual (nama + progress bar)
- [ ] Goal dengan collected >= target tidak muncul by default
- [ ] Toggle "Show all (N done)" muncul kalau ada yang hidden, hide kalau tidak ada
- [ ] Privacy mask aktif saat hideBalances = true
- [ ] Budget Spending section tidak terpengaruh
- [ ] `npm run build` lolos
