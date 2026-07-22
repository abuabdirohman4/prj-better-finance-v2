# Plan: Transactions Feature (List + Input Form)

**Date:** 2026-07-21  
**Issue:** bf-xxx (TBD after bd create)  
**Branch:** feat/bf-xxx-transactions

---

## Context

v2 needs a full transactions feature to replicate v1 (prj-better-finance). v1 was read-only (Google Sheets), v2 must be CRUD. The stub page at `src/app/(app)/transactions/page.tsx` currently just says "coming soon."

Scope:
1. **Input form** — manual entry for expense/income/transfer
2. **List view** — all transactions, grouped by date, with filters
3. **Account balance auto-update** — when transaction saved, `accounts.current_balance` updates

---

## DB Schema (already exists, no migrations needed)

`transactions` table key fields:
- `transaction_type`: `"spending" | "earning" | "transfer"`
- `account_id` → accounts (source account)
- `to_account_id` → accounts (transfer destination, nullable)
- `category_id` → categories (nullable for transfer)
- `amount`: numeric(18,2)
- `transaction_date`: date
- `note`: text nullable
- `deleted_at`: soft delete

`categories` table: `group_name` = `"eating" | "living" | "saving" | "investing" | "giving" | "earning"`

---

## Files to Create

```
src/db/queries/transactions.ts        ← query layer
src/app/(app)/transactions/actions.ts ← server actions
src/app/(app)/transactions/_hooks/useTransactions.ts
src/app/(app)/transactions/_hooks/useCategories.ts
src/app/(app)/transactions/_components/TransactionCard.tsx
src/app/(app)/transactions/_components/TransactionForm.tsx
src/app/(app)/transactions/_components/TransactionBottomSheet.tsx
src/app/(app)/transactions/_components/FilterBar.tsx
```

**Modify:**
```
src/app/(app)/transactions/page.tsx   ← replace stub
src/db/queries/accounts.ts            ← add updateAccountBalance()
src/lib/query.ts                      ← transactionKeys already there, add categoryKeys.list
```

(Note: `categoryKeys` already exported from `src/lib/query.ts`)

---

## Task 1: DB Query Layer — `src/db/queries/transactions.ts`

```typescript
import { and, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { transactions, categories, accounts } from "@/db/schema";

export interface TransactionRow {
  id: string;
  transaction_date: string;
  transaction_type: string;
  amount: number;
  note: string | null;
  account_id: string;
  account_name: string;
  category_id: string | null;
  category_name: string | null;
  to_account_id: string | null;
  to_account_name: string | null;
}

export interface TransactionFilters {
  type?: string[];        // ["spending","earning","transfer"]
  account_id?: string[];
  category_id?: string[];
  note?: string;
  date_from?: string;     // YYYY-MM-DD
  date_to?: string;
  limit?: number;
  offset?: number;
}

export async function getTransactions(
  userId: string,
  filters: TransactionFilters = {}
): Promise<TransactionRow[]> {
  const toAccounts = db.$with("to_acc").as(
    db.select({ id: accounts.id, name: accounts.name }).from(accounts)
  );

  const q = db
    .with(toAccounts)
    .select({
      id: transactions.id,
      transaction_date: transactions.transaction_date,
      transaction_type: transactions.transaction_type,
      amount: transactions.amount,
      note: transactions.note,
      account_id: transactions.account_id,
      account_name: accounts.name,
      category_id: transactions.category_id,
      category_name: categories.name,
      to_account_id: transactions.to_account_id,
      to_account_name: toAccounts.name,
    })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.account_id))
    .leftJoin(categories, eq(categories.id, transactions.category_id))
    .leftJoin(toAccounts, eq(toAccounts.id, transactions.to_account_id))
    .where(
      and(
        eq(transactions.user_id, userId),
        isNull(transactions.deleted_at),
        filters.type?.length ? or(...filters.type.map((t) => eq(transactions.transaction_type, t))) : undefined,
        filters.account_id?.length ? or(...filters.account_id.map((id) => eq(transactions.account_id, id))) : undefined,
        filters.category_id?.length ? or(...filters.category_id.map((id) => eq(transactions.category_id, id))) : undefined,
        filters.note ? sql`${transactions.note} ilike ${"%" + filters.note + "%"}` : undefined,
        filters.date_from ? gte(transactions.transaction_date, filters.date_from) : undefined,
        filters.date_to ? lte(transactions.transaction_date, filters.date_to) : undefined,
      )
    )
    .orderBy(desc(transactions.transaction_date), desc(transactions.created_at))
    .limit(filters.limit ?? 200)
    .offset(filters.offset ?? 0);

  const rows = await q;
  return rows.map((r) => ({
    ...r,
    amount: Number(r.amount),
  }));
}

export interface CreateTransactionInput {
  transaction_date: string;
  transaction_type: "spending" | "earning" | "transfer";
  account_id: string;
  to_account_id?: string;
  category_id?: string;
  amount: number;
  note?: string;
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput
): Promise<string> {
  const [row] = await db
    .insert(transactions)
    .values({
      user_id: userId,
      transaction_date: input.transaction_date,
      transaction_type: input.transaction_type,
      account_id: input.account_id,
      to_account_id: input.to_account_id ?? null,
      category_id: input.category_id ?? null,
      amount: String(input.amount),
      note: input.note ?? null,
    })
    .returning({ id: transactions.id });
  return row.id;
}

export async function softDeleteTransaction(userId: string, txId: string): Promise<void> {
  await db
    .update(transactions)
    .set({ deleted_at: new Date(), updated_at: new Date() })
    .where(and(eq(transactions.id, txId), eq(transactions.user_id, userId)));
}
```

---

## Task 2: Account Balance Update — add to `src/db/queries/accounts.ts`

After `createTransaction`, caller must update `accounts.current_balance`:

```typescript
/** Update current_balance: spending → subtract, earning → add, transfer → subtract source + add dest. */
export async function adjustAccountBalance(
  userId: string,
  accountId: string,
  delta: number   // positive = add, negative = subtract
): Promise<void> {
  await db
    .update(accounts)
    .set({
      current_balance: sql`${accounts.current_balance} + ${String(delta)}`,
      updated_at: new Date(),
    })
    .where(and(eq(accounts.id, accountId), eq(accounts.user_id, userId)));
}
```

---

## Task 3: Category Query — add to `src/db/queries/accounts.ts` or new file

Add `getCategories` to `src/db/queries/accounts.ts` (re-exports pattern — already imports `categories` table):

```typescript
export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  group_name: string;
  icon_name: string | null;
}

export async function getCategories(userId: string): Promise<CategoryRow[]> {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      group_name: categories.group_name,
      icon_name: categories.icon_name,
    })
    .from(categories)
    .where(and(eq(categories.user_id, userId), eq(categories.is_active, true)))
    .orderBy(categories.sort_order);
}
```

---

## Task 4: Server Actions — `src/app/(app)/transactions/actions.ts`

```typescript
"use server";

import {
  getTransactions,
  createTransaction,
  softDeleteTransaction,
  type TransactionRow,
  type TransactionFilters,
  type CreateTransactionInput,
} from "@/db/queries/transactions";
import { adjustAccountBalance, getCategories, type CategoryRow } from "@/db/queries/accounts";
import { requireUser } from "@/lib/accessControlServer";
import { handleApiError, type ServerActionResult } from "@/lib/errorUtils";

export async function getTransactionsAction(
  filters: TransactionFilters = {}
): Promise<ServerActionResult<TransactionRow[]>> {
  try {
    const user = await requireUser();
    const data = await getTransactions(user.id, filters);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat transaksi").message };
  }
}

export async function getCategoriesAction(): Promise<ServerActionResult<CategoryRow[]>> {
  try {
    const user = await requireUser();
    const data = await getCategories(user.id);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat kategori").message };
  }
}

export async function createTransactionAction(
  input: CreateTransactionInput
): Promise<ServerActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const id = await createTransaction(user.id, input);

    // Update account balances
    const delta =
      input.transaction_type === "earning" ? input.amount : -input.amount;
    await adjustAccountBalance(user.id, input.account_id, delta);

    if (input.transaction_type === "transfer" && input.to_account_id) {
      await adjustAccountBalance(user.id, input.to_account_id, input.amount);
    }

    return { success: true, data: { id } };
  } catch (error) {
    return { success: false, message: handleApiError(error, "menyimpan transaksi").message };
  }
}

export async function deleteTransactionAction(
  txId: string
): Promise<ServerActionResult<void>> {
  try {
    const user = await requireUser();
    await softDeleteTransaction(user.id, txId);
    return { success: true };
  } catch (error) {
    return { success: false, message: handleApiError(error, "menghapus transaksi").message };
  }
}
```

---

## Task 5: Hooks

**`src/app/(app)/transactions/_hooks/useTransactions.ts`:**
```typescript
"use client";
import { useQuery } from "@tanstack/react-query";
import { transactionKeys } from "@/lib/query";
import { getTransactionsAction } from "../actions";
import type { TransactionFilters } from "@/db/queries/transactions";

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: async () => {
      const res = await getTransactionsAction(filters);
      if (!res.success) throw new Error(res.message ?? "Gagal memuat transaksi");
      return res.data!;
    },
  });
}
```

**`src/app/(app)/transactions/_hooks/useCategories.ts`:**
```typescript
"use client";
import { useQuery } from "@tanstack/react-query";
import { categoryKeys } from "@/lib/query";
import { getCategoriesAction } from "../actions";

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: async () => {
      const res = await getCategoriesAction();
      if (!res.success) throw new Error(res.message ?? "Gagal memuat kategori");
      return res.data!;
    },
  });
}
```

---

## Task 6: TransactionCard Component

**`src/app/(app)/transactions/_components/TransactionCard.tsx`:**

```tsx
"use client";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/helper";
import { usePrivacyStore } from "@/stores/privacyStore";
import type { TransactionRow } from "@/db/queries/transactions";

const MASK = "Rp ••••";

const TYPE_CONFIG = {
  spending: { icon: ArrowDownLeft, color: "text-red-500", bg: "bg-red-50", sign: "signs" as const },
  earning: { icon: ArrowUpRight, color: "text-green-500", bg: "bg-green-50", sign: "signs" as const },
  transfer: { icon: ArrowLeftRight, color: "text-blue-500", bg: "bg-blue-50", sign: undefined },
};

export function TransactionCard({ tx }: { tx: TransactionRow }) {
  const hideBalances = usePrivacyStore((s) => s.hideBalances);
  const cfg = TYPE_CONFIG[tx.transaction_type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.spending;
  const Icon = cfg.icon;

  const title = tx.note ?? tx.category_name ?? tx.account_name;
  const subtitle =
    tx.transaction_type === "transfer"
      ? `${tx.account_name} → ${tx.to_account_name}`
      : tx.category_name ?? tx.account_name;

  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-400 truncate">{subtitle}</p>
      </div>
      <div className="text-right flex-shrink-0">
        {hideBalances ? (
          <span className={`text-sm font-semibold ${cfg.color}`}>{MASK}</span>
        ) : cfg.sign ? (
          <span
            className={`text-sm font-semibold ${cfg.color}`}
            dangerouslySetInnerHTML={{ __html: formatCurrency(
              tx.transaction_type === "spending" ? -tx.amount : tx.amount,
              cfg.sign
            )}}
          />
        ) : (
          <span className={`text-sm font-semibold ${cfg.color}`}>
            {formatCurrency(tx.amount)}
          </span>
        )}
      </div>
    </div>
  );
}
```

---

## Task 7: TransactionForm Component

**`src/app/(app)/transactions/_components/TransactionForm.tsx`:**

Form fields (controlled):
- **Tipe** — pill selector: Pengeluaran / Pemasukan / Transfer (default: Pengeluaran)
- **Tanggal** — date input (default: today, format `YYYY-MM-DD`)
- **Akun** — select from accounts list
- **Ke Akun** — select (only shown when type = Transfer)
- **Kategori** — select from categories, grouped by group_name (hidden when type = Transfer)
- **Jumlah** — number input, formatted as user types (raw number state + display string)
- **Catatan** — text input, optional

On submit: call `createTransactionAction()`, then `queryClient.invalidateQueries` on:
- `transactionKeys.all`
- `accountKeys.list()`
- `dashboardKeys.all`

Key implementation notes:
- Amount: dual state pattern (`rawValue: number`, `displayValue: string`) — same as RealityCheckForm
- Category grouped: `Object.groupBy(categories, c => c.group_name)` → `<optgroup label>` in select
- Transfer: hide category field, show to_account field
- Validation: amount > 0, account selected, date set

---

## Task 8: TransactionBottomSheet

**`src/app/(app)/transactions/_components/TransactionBottomSheet.tsx`:**

- Wraps `TransactionForm` in a bottom sheet (same pattern as `AccountBottomSheet`)
- Props: `open: boolean`, `onClose: () => void`, `accounts: AccountRow[]`
- On success: call `onClose()` + toast notification

---

## Task 9: FilterBar Component

**`src/app/(app)/transactions/_components/FilterBar.tsx`:**

Collapsible filter panel (same v1 pattern):
- Toggle button shows/hides filters
- When expanded:
  - Type multi-select: Pengeluaran / Pemasukan / Transfer
  - Account multi-select (from accounts list)
  - Category multi-select (from categories list)
  - Note text search
- Active filter count badge on toggle button
- Clear All button
- State: local component state (`filters` object) — passed up via `onFiltersChange` callback

---

## Task 10: Transactions Page — `src/app/(app)/transactions/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { ChevronLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useTransactions } from "./_hooks/useTransactions";
import { useAccounts } from "../accounts/_hooks/useAccounts";
import { useCategories } from "./_hooks/useCategories";
import { TransactionCard } from "./_components/TransactionCard";
import { TransactionBottomSheet } from "./_components/TransactionBottomSheet";
import { FilterBar } from "./_components/FilterBar";
import type { TransactionFilters } from "@/db/queries/transactions";

// Header: blue gradient + wave SVG (same pattern as accounts page)
// Summary: 3 cards (Total Net, Pemasukan, Pengeluaran) computed client-side from data
// FilterBar below summary
// List grouped by date (descending)
// FAB to open TransactionBottomSheet for create
```

Group by date logic:
```typescript
function groupByDate(txs: TransactionRow[]): Record<string, TransactionRow[]> {
  return txs.reduce((acc, tx) => {
    const date = tx.transaction_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {} as Record<string, TransactionRow[]>);
}
```

Summary computations (client-side from data):
- `earning` = sum of `amount` where `transaction_type === "earning"`
- `spending` = sum of `amount` where `transaction_type === "spending"`
- `net` = earning - spending

---

## Commit Message Template

```
feat: transactions list and input form

- Add transactions query layer with filters (spending/earning/transfer)
- Add adjustAccountBalance to update current_balance on transaction create
- Add getCategories query
- Server actions: getTransactions, createTransaction, deleteTransaction
- TransactionCard, TransactionForm, TransactionBottomSheet, FilterBar components
- Transactions page: list grouped by date, summary cards, FAB create
- Auto-update account balances on transaction save

fixes #XX

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## Verification

1. `npm run dev` — dev server starts
2. Navigate to `/transactions` — page renders (no "coming soon")
3. FAB tap → bottom sheet opens with form
4. Input spending → save → list updates, account balance decreases
5. Input earning → save → list updates, account balance increases
6. Input transfer → save → source balance decreases, dest balance increases
7. Filter by type → list filters correctly
8. Filter by note text → only matching rows show
9. Privacy toggle → amounts masked

---

## CLAUDE.md Check
- [ ] Pattern baru? — `adjustAccountBalance` SQL delta pattern, perlu didokumentasikan di AGENTS.md
- [ ] Table baru? — tidak ada, `transactions` sudah ada
- [ ] Route baru? — `/transactions` sudah ada sebagai stub
- [ ] Permission pattern baru? — tidak
- [ ] Jika ada update → tambah ke AGENTS.md: "Saat input transaksi, panggil `adjustAccountBalance` untuk update `current_balance` (delta: +amount earning, -amount spending, -amount source + +amount dest transfer)"
