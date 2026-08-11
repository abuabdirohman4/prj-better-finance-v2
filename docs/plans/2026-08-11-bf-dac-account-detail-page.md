# bf-dac — Account Detail Page: Klik Akun → List Transaksi

**Date:** 2026-08-11  
**Issue:** bf-dac  
**Status:** Plan  
**Migration:** ❌ None

---

## Context

Klik akun (di `/accounts` atau `/assets`) → halaman daftar transaksi akun itu. Universal semua akun termasuk AR/AP (lihat daftar piutang/utang). Filter transactions `account_id OR to_account_id`. Berguna untuk audit per-akun.

**Existing:**
- Route `/accounts/[id]` sudah ada — dipakai untuk **balancing** (reality check + wallet denominations), BUKAN list transaksi
- `getTransactions` (`src/db/queries/transactions.ts`) sudah punya filter `account_id` — TAPI hanya cek `transactions.account_id`, tidak cek `to_account_id`. Untuk audit per-akun butuh keduanya (transfer masuk = akun jadi `to_account_id`).

**Keputusan:** tambah tab/section transaksi di halaman `/accounts/[id]` yang sudah ada, ATAU route baru `/accounts/[id]/transactions`. Pilih: **tambah di `/accounts/[id]` existing** sebagai section baru di bawah balancing — hemat, 1 halaman = 1 akun lengkap.

---

## Design

Halaman `/accounts/[id]` sekarang: header + CalculationBalanceCard + RealityCheckForm + WalletDenominations.  
Tambah di bawahnya: **"Transaction History"** section — list transaksi akun ini (as source OR destination), grouped by date, read-only (klik → ke `/transactions` untuk edit; atau cukup tampil).

Untuk AR/AP: akun ini tetap punya `/accounts/[id]` walau tidak muncul di list `/accounts` (bf-3e0 filter liquid). Bisa diakses via `/assets` liabilities card klik. Pastikan link di LiabilityCard (`/assets`) mengarah ke `/accounts/[id]`.

---

## Tasks

### Task 1 — Query: transaksi by account (source OR dest)

**File:** `src/db/queries/transactions.ts`

`getTransactions` filter `account_id` saat ini hanya `eq(transactions.account_id, id)`. Tambah query dedicated untuk audit per-akun yang cek OR:

```ts
export async function getTransactionsForAccount(
  userId: string,
  accountId: string,
  limit = 200
): Promise<TransactionRow[]> {
  const toAccounts = db.$with("to_acc").as(
    db.select({ id: accounts.id, name: accounts.name }).from(accounts).where(eq(accounts.user_id, userId))
  );

  const rows = await db
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
      goal_id: transactions.goal_id,
    })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.account_id))
    .leftJoin(categories, eq(categories.id, transactions.category_id))
    .leftJoin(toAccounts, eq(toAccounts.id, transactions.to_account_id))
    .where(
      and(
        eq(transactions.user_id, userId),
        isNull(transactions.deleted_at),
        or(
          eq(transactions.account_id, accountId),
          eq(transactions.to_account_id, accountId),
        ),
      )
    )
    .orderBy(desc(transactions.transaction_date), desc(transactions.created_at))
    .limit(limit);

  return rows.map((r) => ({ ...r, amount: Number(r.amount) }));
}
```

> `or` sudah di-import di file ini (dipakai di `getTransactions`). Cek imports.

### Task 2 — Action

**File:** `src/app/(app)/accounts/[id]/actions.ts`

```ts
import { getTransactionsForAccount } from "@/db/queries/transactions";
import type { TransactionRow } from "@/db/queries/transactions";

export async function getAccountTransactionsAction(
  accountId: string
): Promise<ServerActionResult<TransactionRow[]>> {
  try {
    const user = await requireUser();
    const parsed = z.string().uuid().safeParse(accountId);
    if (!parsed.success) return { success: false, message: "ID akun tidak valid." };
    const data = await getTransactionsForAccount(user.id, accountId);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}
```

> Cek `src/app/(app)/accounts/[id]/actions.ts` untuk imports existing (`requireUser`, `handleApiError`, `z`).

### Task 3 — Component: AccountTransactionHistory

**File:** `src/app/(app)/accounts/[id]/_components/AccountTransactionHistory.tsx` (baru)

```tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/helper";
import { usePrivacyStore } from "@/stores/privacyStore";
import { getAccountTransactionsAction } from "../actions";

const TYPE_SIGN: Record<string, "in" | "out"> = {
  earning: "in", spending: "out", transfer: "out",
};

export function AccountTransactionHistory({ accountId }: { accountId: string }) {
  const hideBalances = usePrivacyStore((s) => s.hideBalances);
  const { data = [], isLoading } = useQuery({
    queryKey: ["account-transactions", accountId],
    queryFn: async () => {
      const res = await getAccountTransactionsAction(accountId);
      if (!res.success) throw new Error(res.message);
      return res.data!;
    },
    staleTime: 30_000,
  });

  if (isLoading) return <div className="h-40 animate-pulse bg-gray-100 rounded-2xl" />;
  if (data.length === 0) return (
    <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
      <p className="text-gray-400 text-sm">No transactions for this account.</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-bold text-gray-900 text-base">Transaction History</h2>
      </div>
      <div className="divide-y divide-gray-50">
        {data.map((tx) => {
          // For transfer: is this account the destination (money in) or source (money out)?
          const isDestination = tx.to_account_id === accountId;
          const sign = tx.transaction_type === "transfer"
            ? (isDestination ? "in" : "out")
            : TYPE_SIGN[tx.transaction_type];
          return (
            <div key={tx.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{tx.note ?? tx.category_name ?? "-"}</p>
                <p className="text-[10px] text-gray-400">
                  {tx.transaction_date}
                  {tx.transaction_type === "transfer" && (
                    <> · {isDestination ? `from ${tx.account_name}` : `to ${tx.to_account_name}`}</>
                  )}
                </p>
              </div>
              <span className={`text-sm font-bold ${sign === "in" ? "text-green-600" : "text-red-500"}`}>
                {sign === "in" ? "+" : "-"}
                {hideBalances ? "•••" : formatCurrency(tx.amount, "short")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Task 4 — Render di halaman detail

**File:** `src/app/(app)/accounts/[id]/page.tsx`

Import `AccountTransactionHistory`, render setelah balancing components (di bawah WalletDenominations / RealityCheckForm):
```tsx
<AccountTransactionHistory accountId={id} />
```
> Cek bagaimana `page.tsx` mendapat `id` (params). Pakai variabel yang sama.

### Task 5 — LiabilityCard link ke /accounts/[id]

**File:** `src/app/(app)/assets/page.tsx`

`LiabilityCard` (dari bf-3e0) — bungkus dengan `<Link href={`/accounts/${asset.id}`}>` supaya AR/AP bisa dibuka. Cek apakah bf-3e0 sudah bikin link; kalau belum, tambah.

---

## Files Changed

| File | Perubahan |
|---|---|
| `src/db/queries/transactions.ts` | `getTransactionsForAccount` (OR account_id/to_account_id) |
| `src/app/(app)/accounts/[id]/actions.ts` | `getAccountTransactionsAction` |
| `src/app/(app)/accounts/[id]/_components/AccountTransactionHistory.tsx` | Component baru |
| `src/app/(app)/accounts/[id]/page.tsx` | Render history section |
| `src/app/(app)/assets/page.tsx` | LiabilityCard link ke detail |

Threshold: 5 files → **Mode A (Antigravity)**

---

## CLAUDE.md Check
- [ ] Pattern baru: `getTransactionsForAccount` = audit per-akun via OR account_id/to_account_id
- [ ] Tidak ada tabel/schema baru
- [ ] Route existing `/accounts/[id]` dapat section baru (bukan route baru)
- [ ] Update AGENTS.md: dokumentasikan account detail history
