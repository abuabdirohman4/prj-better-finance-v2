# bf-z8z — Budget Category Drill-down

**Date:** 2026-08-11
**Issue:** bf-z8z

---

## Context

User ingin tap budget card di `/budgets` → muncul bottom sheet dengan list transaksi
kategori tersebut untuk bulan yang dipilih. Saat ini tap = buka edit form.

Redesign UX: tap card = drill-down (lihat transaksi), edit budget = button di dalam drill-down sheet.

---

## Design

```
[Tap Dining Out card]
  ↓
Bottom Sheet:
  ┌─────────────────────────────┐
  │ Dining Out          [Edit]  │
  │ Rp 234k / Rp 500k  (46%)   │
  │ ─────────────────────────── │
  │  Aug 5   Bakso      Rp 25k  │
  │  Aug 8   Mie Ayam   Rp 18k  │
  │  Aug 10  Nasi Padang Rp 32k │
  └─────────────────────────────┘
```

Sheet = read-only list. "Edit" button di header → buka BudgetBottomSheet existing.

---

## Tasks

### Task 0 — Fix: exclude saving/investing dari Budget Spending section

**File:** `src/db/queries/budgets.ts`, function `getBudgetsWithSpending`

Saat ini kategori `Saving` + `Investment` (group: saving/investing) yang di-activate untuk bf-i6e muncul di Budget Spending section karena filter hanya exclude `earning`. Fix:

```ts
// Sebelum:
const rows = type === "earning"
  ? allRows.filter((r) => r.group_name === "earning")
  : allRows.filter((r) => r.group_name !== "earning");

// Sesudah:
const rows = type === "earning"
  ? allRows.filter((r) => r.group_name === "earning")
  : allRows.filter((r) => r.group_name !== "earning" && r.group_name !== "saving" && r.group_name !== "investing");
```

Verifikasi: `/budgets` page tidak lagi tampilkan Saving/Investing di Budget Spending section.

### Task 1 — Add `getTransactionsForBudget` query

**File:** `src/db/queries/budgets.ts`

```ts
export interface BudgetTxRow {
  id: string;
  transaction_date: string;
  note: string | null;
  amount: number;
  account_name: string;
}

export async function getTransactionsForBudget(
  userId: string,
  categoryId: string,
  year: number,
  month: number,
  type: "spending" | "earning" = "spending"
): Promise<BudgetTxRow[]> {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

  return db
    .select({
      id: transactions.id,
      transaction_date: sql<string>`${transactions.transaction_date}::text`,
      note: transactions.note,
      amount: sql<number>`${transactions.amount}::numeric`,
      account_name: sql<string>`COALESCE(${accounts.name}, '')`,
    })
    .from(transactions)
    .leftJoin(accounts, eq(transactions.account_id, accounts.id))
    .where(
      and(
        eq(transactions.user_id, userId),
        eq(transactions.category_id, categoryId),
        eq(transactions.transaction_type, type),
        isNull(transactions.deleted_at),
        sql`${transactions.transaction_date} >= ${startDate}`,
        sql`${transactions.transaction_date} <= ${endDate}`,
      )
    )
    .orderBy(sql`${transactions.transaction_date} DESC`);
}
```

Import `accounts` dari `@/db/schema` jika belum ada di budgets.ts.

### Task 2 — Add server action

**File:** `src/app/(app)/budgets/actions.ts`

```ts
import { getTransactionsForBudget, type BudgetTxRow } from "@/db/queries/budgets";

export async function getBudgetTransactionsAction(
  categoryId: string,
  year: number,
  month: number
): Promise<ServerActionResult<BudgetTxRow[]>> {
  try {
    const user = await requireUser();
    const parsed = z.string().uuid().safeParse(categoryId);
    if (!parsed.success) return { success: false, message: "Invalid category." };
    const data = await getTransactionsForBudget(user.id, categoryId, year, month);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}
```

### Task 3 — Create BudgetDrillSheet component

**File:** `src/app/(app)/budgets/_components/BudgetDrillSheet.tsx` (new file)

Pattern: sama dengan TransactionBottomSheet (overlay + slide-up, useEffect open).

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Pencil } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getBudgetTransactionsAction } from "../actions";
import { formatCurrency } from "@/lib/helper";
import type { BudgetWithSpending } from "@/db/queries/budgets";

interface Props {
  open: boolean;
  onClose: () => void;
  budget: BudgetWithSpending | null;
  year: number;
  month: number;
  onEdit: (budget: BudgetWithSpending) => void;
  hideBalances: boolean;
}

const MASK = "Rp •••";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function BudgetDrillSheet({ open, onClose, budget, year, month, onEdit, hideBalances }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true));
  }, [open]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  const txQuery = useQuery({
    queryKey: ["budget-drill", budget?.category_id, year, month],
    queryFn: async () => {
      if (!budget) return [];
      const res = await getBudgetTransactionsAction(budget.category_id, year, month);
      if (!res.success) throw new Error(res.message);
      return res.data!;
    },
    enabled: open && !!budget,
    staleTime: 30_000,
  });

  if (!open && !visible) return null;
  if (!budget) return null;

  const remaining = budget.budgeted_amount - budget.actual_spending;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />
      <div
        className="fixed bottom-0 left-1/2 w-full max-w-md bg-white rounded-t-3xl z-50 shadow-2xl transition-transform duration-300 max-h-[85vh] flex flex-col"
        style={{ transform: visible ? "translate(-50%, 0)" : "translate(-50%, 100%)" }}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">{budget.category_name}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(budget)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Budget
              </button>
              <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>{hideBalances ? MASK : `${formatCurrency(budget.actual_spending)} spent`}</span>
            <span>{hideBalances ? MASK : `${formatCurrency(remaining > 0 ? remaining : 0)} left`}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${budget.percent > 100 ? "bg-red-500" : budget.percent >= 80 ? "bg-amber-400" : "bg-green-500"}`}
              style={{ width: `${Math.min(budget.percent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">{MONTHS[month - 1]} {year}</p>
        </div>

        {/* Transaction list */}
        <div className="overflow-y-auto flex-1 pb-6">
          {txQuery.isLoading && (
            <div className="p-6 space-y-3">
              {[1,2,3].map(i => <div key={i} className="animate-pulse h-12 bg-gray-100 rounded-xl" />)}
            </div>
          )}
          {!txQuery.isLoading && (txQuery.data ?? []).length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
              No transactions this month.
            </div>
          )}
          {!txQuery.isLoading && (txQuery.data ?? []).map(tx => (
            <div key={tx.id} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{tx.note || "—"}</p>
                <p className="text-[11px] text-gray-400">{tx.transaction_date} · {tx.account_name}</p>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {hideBalances ? MASK : formatCurrency(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
```

### Task 4 — Update BudgetCard: tap = drill-down

**File:** `src/app/(app)/budgets/_components/BudgetCard.tsx`

Rename prop `onEdit` → `onTap`:

```tsx
interface Props {
  budget: BudgetWithSpending;
  onTap: (budget: BudgetWithSpending) => void;  // was: onEdit
  hideBalances: boolean;
  isEarning?: boolean;
}

// in component:
<button onClick={() => onTap(budget)} ...>
```

### Task 5 — Update BudgetGroup: pass onTap

**File:** `src/app/(app)/budgets/_components/BudgetGroup.tsx`

```tsx
interface Props {
  ...
  onTap: (b: BudgetWithSpending) => void;  // was: onEdit
}

<BudgetCard key={b.id} budget={b} onTap={onTap} hideBalances={hideBalances} isEarning={group === "earning"} />
```

### Task 6 — Update page.tsx: wire drill-down + edit flow

**File:** `src/app/(app)/budgets/page.tsx`

```tsx
const [drillBudget, setDrillBudget] = useState<BudgetWithSpending | null>(null);
const [drillOpen, setDrillOpen] = useState(false);

function openDrill(b: BudgetWithSpending) {
  setDrillBudget(b);
  setDrillOpen(true);
}

function openEditFromDrill(b: BudgetWithSpending) {
  setDrillOpen(false);
  setTimeout(() => {
    setEditBudget(b);
    setSheetOpen(true);
  }, 320);  // wait for drill sheet to close
}

// In JSX:
<BudgetGroup ... onTap={openDrill} />

<BudgetDrillSheet
  open={drillOpen}
  onClose={() => setDrillOpen(false)}
  budget={drillBudget}
  year={year}
  month={month}
  onEdit={openEditFromDrill}
  hideBalances={hideBalances}
/>
```

Also update `IncomeBudgetSection` / `BudgetGroup` for earning group to use `onTap={openDrill}`.

### Task 7 — Drill-down untuk Budget Transfers (Saving/Investing)

Budget Transfers section (bf-i6e) punya 2 card: Saving + Investing. Tap → bottom sheet list transfer transactions per goal_type bulan ini.

**File:** `src/db/queries/budgets.ts` — tambah function:

```ts
export interface TransferTxRow {
  id: string;
  transaction_date: string;
  note: string | null;
  amount: number;
  account_name: string;
  goal_name: string;
}

export async function getTransactionsForTransferBucket(
  userId: string,
  goalType: "Saving" | "Investment",
  year: number,
  month: number
): Promise<TransferTxRow[]> {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

  return db
    .select({
      id: transactions.id,
      transaction_date: sql<string>`${transactions.transaction_date}::text`,
      note: transactions.note,
      amount: sql<number>`${transactions.amount}::numeric`,
      account_name: sql<string>`COALESCE(${accounts.name}, '')`,
      goal_name: sql<string>`COALESCE(${savingsGoals.name}, '')`,
    })
    .from(transactions)
    .leftJoin(accounts, eq(transactions.account_id, accounts.id))
    .innerJoin(savingsGoals, eq(transactions.goal_id, savingsGoals.id))
    .where(
      and(
        eq(transactions.user_id, userId),
        eq(transactions.transaction_type, "transfer"),
        eq(savingsGoals.goal_type, goalType),
        isNull(transactions.deleted_at),
        sql`${transactions.transaction_date} >= ${startDate}`,
        sql`${transactions.transaction_date} <= ${endDate}`,
      )
    )
    .orderBy(sql`${transactions.transaction_date} DESC`);
}
```

Import `savingsGoals` dari `@/db/schema`.

**File:** `src/app/(app)/budgets/actions.ts` — tambah action:

```ts
import { getTransactionsForTransferBucket, type TransferTxRow } from "@/db/queries/budgets";

export async function getTransferBucketTransactionsAction(
  goalType: "Saving" | "Investment",
  year: number,
  month: number
): Promise<ServerActionResult<TransferTxRow[]>> {
  try {
    const user = await requireUser();
    const data = await getTransactionsForTransferBucket(user.id, goalType, year, month);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}
```

**File:** `src/app/(app)/budgets/_components/TransferDrillSheet.tsx` (new file)

Mirip `BudgetDrillSheet` tapi untuk transfer bucket. Props: `open`, `onClose`, `bucketType: "Saving" | "Investment" | null`, `bucketLabel: string`, `year`, `month`, `hideBalances`.

```tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTransferBucketTransactionsAction } from "../actions";
import { formatCurrency } from "@/lib/helper";

interface Props {
  open: boolean;
  onClose: () => void;
  bucketType: "Saving" | "Investment" | null;
  bucketLabel: string;
  year: number;
  month: number;
  hideBalances: boolean;
}

const MASK = "Rp •••";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function TransferDrillSheet({ open, onClose, bucketType, bucketLabel, year, month, hideBalances }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true));
  }, [open]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  const txQuery = useQuery({
    queryKey: ["transfer-drill", bucketType, year, month],
    queryFn: async () => {
      if (!bucketType) return [];
      const res = await getTransferBucketTransactionsAction(bucketType, year, month);
      if (!res.success) throw new Error(res.message);
      return res.data!;
    },
    enabled: open && !!bucketType,
    staleTime: 30_000,
  });

  if (!open && !visible) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />
      <div
        className="fixed bottom-0 left-1/2 w-full max-w-md bg-white rounded-t-3xl z-50 shadow-2xl transition-transform duration-300 max-h-[85vh] flex flex-col"
        style={{ transform: visible ? "translate(-50%, 0)" : "translate(-50%, 100%)" }}
      >
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-gray-900">{bucketLabel}</h2>
            <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-400">{MONTHS[month - 1]} {year} · Transfer transactions</p>
        </div>

        <div className="overflow-y-auto flex-1 pb-6">
          {txQuery.isLoading && (
            <div className="p-6 space-y-3">
              {[1,2,3].map(i => <div key={i} className="animate-pulse h-14 bg-gray-100 rounded-xl" />)}
            </div>
          )}
          {!txQuery.isLoading && (txQuery.data ?? []).length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">No transfers this month.</div>
          )}
          {!txQuery.isLoading && (txQuery.data ?? []).map(tx => (
            <div key={tx.id} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{tx.goal_name}</p>
                <p className="text-[11px] text-gray-400">{tx.transaction_date} · {tx.note || tx.account_name}</p>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {hideBalances ? MASK : formatCurrency(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
```

**File:** `src/app/(app)/budgets/_components/SavingBudgetSection.tsx`

Tambah `onDrillDown` prop:
```tsx
interface Props {
  items: TransferBudgetRow[];
  hideBalances: boolean;
  onSetBudget?: (item: TransferBudgetRow) => void;
  onDrillDown?: (item: TransferBudgetRow) => void;  // tambah ini
}

// Ganti onClick button:
onClick={() => onDrillDown?.(item) ?? onSetBudget?.(item)}
// Atau: tap = drill-down, edit budget = button terpisah di header
```

Lebih simpel: tap card = drill-down (bukan set budget). Set budget tetap via FAB + kategori picker.

**File:** `src/app/(app)/budgets/page.tsx` — tambah state + render TransferDrillSheet:

```tsx
const [transferDrillType, setTransferDrillType] = useState<"Saving" | "Investment" | null>(null);
const [transferDrillLabel, setTransferDrillLabel] = useState("");
const [transferDrillOpen, setTransferDrillOpen] = useState(false);

function openTransferDrill(item: TransferBudgetRow) {
  setTransferDrillType(item.type === "saving" ? "Saving" : "Investment");
  setTransferDrillLabel(item.label);
  setTransferDrillOpen(true);
}

// In JSX:
<SavingBudgetSection
  items={transferBudgets}
  hideBalances={hideBalances}
  onDrillDown={openTransferDrill}
/>

<TransferDrillSheet
  open={transferDrillOpen}
  onClose={() => setTransferDrillOpen(false)}
  bucketType={transferDrillType}
  bucketLabel={transferDrillLabel}
  year={year}
  month={month}
  hideBalances={hideBalances}
/>
```

---

## Files Changed

| File | Perubahan |
|---|---|
| `src/db/queries/budgets.ts` | Task 0: fix exclude saving/investing · Task 1: add `getTransactionsForBudget` · Task 7: add `getTransactionsForTransferBucket` |
| `src/app/(app)/budgets/actions.ts` | Task 2: add `getBudgetTransactionsAction` · Task 7: add `getTransferBucketTransactionsAction` |
| `src/app/(app)/budgets/_components/BudgetDrillSheet.tsx` | Task 3: new file |
| `src/app/(app)/budgets/_components/TransferDrillSheet.tsx` | Task 7: new file |
| `src/app/(app)/budgets/_components/BudgetCard.tsx` | Task 4: rename onEdit → onTap |
| `src/app/(app)/budgets/_components/BudgetGroup.tsx` | Task 5: pass onTap |
| `src/app/(app)/budgets/_components/SavingBudgetSection.tsx` | Task 7: add onDrillDown prop |
| `src/app/(app)/budgets/page.tsx` | Task 6+7: wire drill-down state |

8 files → **Mode A (Antigravity)**

---

## CLAUDE.md Check
- [ ] Pattern baru: budget drill-down = BudgetDrillSheet (read-only txn list per category)
- [ ] Tidak ada tabel/schema baru
- [ ] Update AGENTS.md setelah implementasi
