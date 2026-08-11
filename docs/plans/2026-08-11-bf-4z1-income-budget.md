# bf-4z1 — Income Budget: Sisi Pemasukan di Halaman Budget

**Date:** 2026-08-11  
**Issue:** bf-4z1  
**Status:** Plan

---

## Context

Halaman `/budgets` saat ini hanya tampilkan expense budgets (kategori spending).
User ingin juga track **income target** per bulan — berapa yang direncanakan masuk vs aktual yang sudah masuk.

Contoh: target Salary 10jt, masuk 9,5jt → 95% achieved.

**Data yang sudah ada:**
- Tabel `budgets` bisa simpan budget untuk semua `category_id`
- Kategori earning sudah ada (group_name = `"earning"`)
- Transaksi earning sudah ada, sum per kategori = aktual income
- Kategori picker di `TransactionForm` sudah filter earning vs spending by `group_name`

**Yang perlu dibuat:**
- UI section "Income Budget" terpisah di `/budgets`
- Query `getBudgetsWithSpending` perlu split menjadi expense vs income
- Income budget tampil di bawah Overall card, di atas Expense section

---

## Design

```
[Overall Progress Card]  — tetap ada, tapi hanya expense

[Income Budget Section]
  Budget Income  | Actual Income | Remaining
  ----------
  [Earning Group: Salary | Net Salary | Allowance | ...]
  Budget: 10jt | Actual: 9.5jt | 95%

[Expense Budget Section]  — existing, tidak berubah
  [Eating Group]
  [Living Group]
  ...
```

Progress bar income = hijau, makin besar makin baik (berbeda dari expense yang makin besar = bahaya).

---

## Tasks

### Task 1 — Update `getBudgetsWithSpending` untuk handle income

**File:** `src/db/queries/budgets.ts`

Saat ini query `spending` hanya filter `transaction_type === "spending"`.
Income budget butuh `transaction_type === "earning"`.

Approach: tambah parameter `type: "spending" | "earning"` ke `getBudgetsWithSpending`:

```ts
export async function getBudgetsWithSpending(
  userId: string,
  year: number,
  month: number,
  type: "spending" | "earning" = "spending"  // default tetap spending
): Promise<BudgetWithSpending[]> {
  // Filter getBudgets by transaction_type matching category group
  const allRows = await getBudgets(userId, year, month);
  
  // Split by group: earning categories vs spending categories
  const rows = type === "earning"
    ? allRows.filter(r => r.group_name === "earning")
    : allRows.filter(r => r.group_name !== "earning");
  
  if (rows.length === 0) return [];

  // ... sum transaksi, ganti eq(transactions.transaction_type, "spending") 
  // dengan eq(transactions.transaction_type, type)
```

Full updated function:
```ts
export async function getBudgetsWithSpending(
  userId: string,
  year: number,
  month: number,
  type: "spending" | "earning" = "spending"
): Promise<BudgetWithSpending[]> {
  const allRows = await getBudgets(userId, year, month);
  const rows = type === "earning"
    ? allRows.filter(r => r.group_name === "earning")
    : allRows.filter(r => r.group_name !== "earning");

  if (rows.length === 0) return [];

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

  const actual = await db
    .select({
      category_id: transactions.category_id,
      total: sql<number>`sum(${transactions.amount})::numeric`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.user_id, userId),
        eq(transactions.transaction_type, type),
        sql`${transactions.transaction_date} >= ${startDate}`,
        sql`${transactions.transaction_date} <= ${endDate}`,
        sql`${transactions.deleted_at} is null`,
        inArray(transactions.category_id, rows.map(r => r.category_id))
      )
    )
    .groupBy(transactions.category_id);

  const actualMap = new Map(actual.map(s => [s.category_id, s.total]));
  return rows.map(r => {
    const spent = actualMap.get(r.category_id) ?? 0;
    const percent = r.budgeted_amount > 0 ? (spent / r.budgeted_amount) * 100 : 0;
    return { ...r, actual_spending: spent, percent };
  });
}
```

### Task 2 — Update `getBudgetsAction` + tambah `getIncomeBudgetsAction`

**File:** `src/app/(app)/budgets/actions.ts`

Tambah action baru untuk income budgets:
```ts
export async function getIncomeBudgetsAction(
  year: number,
  month: number
): Promise<ServerActionResult<BudgetWithSpending[]>> {
  try {
    const user = await requireUser();
    const data = await getBudgetsWithSpending(user.id, year, month, "earning");
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}
```

> `getBudgetsAction` tetap return spending saja (backward compat, tidak ubah signature).

### Task 3 — Update `useBudgets` hook

**File:** `src/app/(app)/budgets/_hooks/useBudgets.ts`

Tambah query untuk income budgets:
```ts
const incomeQuery = useQuery({
  queryKey: budgetKeys.income(year, month),  // tambah key generator
  queryFn: async () => {
    const res = await getIncomeBudgetsAction(year, month);
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },
  staleTime: 30_000,
});
```

Return `incomeQuery` dari hook.

**File:** `src/lib/query.ts` — tambah `income` key generator ke `budgetKeys`:
```ts
// Cek file ini dulu untuk pattern yang ada
income: (year: number, month: number) => [...budgetKeys.all, "income", year, month] as const,
```

### Task 4 — Tambah `IncomeBudgetSection` component

**File:** `src/app/(app)/budgets/_components/IncomeBudgetSection.tsx` (file baru)

```tsx
"use client";
import { formatCurrency } from "@/lib/helper";
import type { BudgetWithSpending } from "@/db/queries/budgets";

interface Props {
  items: BudgetWithSpending[];
  hideBalances: boolean;
  onEdit: (b: BudgetWithSpending) => void;
}

export function IncomeBudgetSection({ items, hideBalances, onEdit }: Props) {
  if (items.length === 0) return null;
  
  const totalBudgeted = items.reduce((s, b) => s + b.budgeted_amount, 0);
  const totalActual = items.reduce((s, b) => s + b.actual_spending, 0);
  const percent = totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0;
  const MASK = "Rp •••";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-base">Income Budget</h2>
        <span className="text-xs text-green-600 font-semibold">{percent.toFixed(0)}%</span>
      </div>
      
      {/* Overall income progress */}
      <div className="px-5 py-3 bg-green-50/50 border-b border-gray-100">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Target: {hideBalances ? MASK : formatCurrency(totalBudgeted, "short")}</span>
          <span>Actual: {hideBalances ? MASK : formatCurrency(totalActual, "short")}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>
      
      {/* Per kategori */}
      <div className="divide-y divide-gray-50">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onEdit(item)}
            className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
          >
            <span className="text-sm font-medium text-gray-800">{item.category_name}</span>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.min(item.percent, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8 text-right">{item.percent.toFixed(0)}%</span>
              </div>
              <span className="text-xs text-gray-400 mt-0.5 block">
                {hideBalances ? MASK : formatCurrency(item.actual_spending, "short")} / {hideBalances ? MASK : formatCurrency(item.budgeted_amount, "short")}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Task 5 — Update `/budgets` page — tampilkan income section

**File:** `src/app/(app)/budgets/page.tsx`

Import `incomeQuery` dari `useBudgets` hook dan tambah `IncomeBudgetSection`:

```tsx
const { query, incomeQuery, categoriesQuery, upsertMutation, deleteMutation } = useBudgets(year, month);
const incomeBudgets = incomeQuery.data ?? [];
```

Tambah `IncomeBudgetSection` setelah Overall Progress Card dan sebelum "Budget Spending" header:

```tsx
{/* Income Budget Section */}
{!query.isLoading && incomeBudgets.length > 0 && (
  <IncomeBudgetSection
    items={incomeBudgets}
    hideBalances={hideBalances}
    onEdit={openEdit}
  />
)}
```

Juga update `BudgetBottomSheet` form — kategori income perlu bisa dipilih. Saat ini `getCategoriesForBudgetAction` return semua kategori aktif. Tinggal pastikan income categories muncul di picker.

> Pertanyaan desain: "Add Budget" FAB — kalau user tap dari Income section, pre-select income type? Untuk sekarang: FAB selalu open blank form, user pilih sendiri. Iterate nanti.

### Task 6 — Update Overall Progress card — hanya expense

**File:** `src/app/(app)/budgets/page.tsx`

Overall Progress Card yang ada sekarang hitung semua budgets. Dengan adanya income section terpisah, Overall card hanya untuk expense:

```ts
// Ganti dari `budgets` ke filter non-earning
const expenseBudgets = budgets.filter(b => b.group_name !== "earning");
const totalBudgeted = expenseBudgets.reduce((s, b) => s + Number(b.budgeted_amount), 0);
const totalSpent = expenseBudgets.reduce((s, b) => s + Number(b.actual_spending), 0);
```

---

## Files Changed

| File | Perubahan |
|---|---|
| `src/db/queries/budgets.ts` | `getBudgetsWithSpending` terima `type` param |
| `src/app/(app)/budgets/actions.ts` | Tambah `getIncomeBudgetsAction` |
| `src/app/(app)/budgets/_hooks/useBudgets.ts` | Tambah `incomeQuery` |
| `src/lib/query.ts` | Tambah `budgetKeys.income` |
| `src/app/(app)/budgets/_components/IncomeBudgetSection.tsx` | Component baru |
| `src/app/(app)/budgets/page.tsx` | Integrate income section + filter expense totals |

Threshold: 6 files → **Mode A (Antigravity)**

---

## CLAUDE.md Check
- [ ] Pattern baru: income budget = budget dengan `group_name === "earning"` categories, `transaction_type = "earning"`
- [ ] Tidak ada tabel/schema baru
- [ ] Tidak ada route baru
- [ ] Update `AGENTS.md` setelah implementasi: tambah catatan income budget di section Budgets
