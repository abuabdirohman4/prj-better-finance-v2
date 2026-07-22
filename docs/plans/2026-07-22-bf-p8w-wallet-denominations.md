# Plan: Wallet Denominations (bf-p8w)

**Date:** 2026-07-22  
**Issue:** bf-p8w  
**Route:** `/accounts/[id]` — section tambahan di bawah RealityCheckForm, hanya untuk akun `is_wallet=true`

---

## Context

v1 punya halaman `/accounts/wallet-fractions` — input jumlah lembar/koin per pecahan IDR, hitung total, tampilkan selisih vs saldo. Di v2 fitur ini diintegrasikan langsung ke halaman balancing `/accounts/[id]` sebagai section bawah — lebih kontekstual karena user sudah lihat saldo dan reality check di halaman yang sama.

Schema `wallet_denominations` sudah ada di DB:
```
id, account_id, user_id, denomination (int), note_type ('paper'|'coin'), count (int), updated_at
UNIQUE(account_id, denomination, note_type)
```

---

## Files yang Dibuat / Diubah

```
BARU:
  src/db/queries/walletDenominations.ts
  src/app/(app)/accounts/[id]/actions.ts
  src/app/(app)/accounts/[id]/_hooks/useWalletDenominations.ts
  src/app/(app)/accounts/[id]/_components/WalletDenominations.tsx

UBAH:
  src/lib/query.ts                      — tambah walletDenominationKeys
  src/app/(app)/accounts/[id]/page.tsx  — render <WalletDenominations> jika is_wallet
```

---

## Task 1 — Tambah query key ke `src/lib/query.ts`

Tambah setelah `wishlistKeys`:

```ts
export const walletDenominationKeys = {
  all: ["wallet-denominations"] as const,
  byAccount: (accountId: string) => [...walletDenominationKeys.all, accountId] as const,
};
```

---

## Task 2 — Drizzle queries: `src/db/queries/walletDenominations.ts`

```ts
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { walletDenominations } from "@/db/schema";

export interface WalletDenominationRow {
  id: string;
  denomination: number;
  note_type: string;
  count: number;
  updated_at: Date;
}

export async function getWalletDenominations(
  userId: string,
  accountId: string
): Promise<WalletDenominationRow[]> {
  const rows = await db
    .select({
      id: walletDenominations.id,
      denomination: walletDenominations.denomination,
      note_type: walletDenominations.note_type,
      count: walletDenominations.count,
      updated_at: walletDenominations.updated_at,
    })
    .from(walletDenominations)
    .where(
      and(
        eq(walletDenominations.user_id, userId),
        eq(walletDenominations.account_id, accountId)
      )
    )
    .orderBy(walletDenominations.denomination);
  return rows;
}

export async function upsertWalletDenominations(
  userId: string,
  accountId: string,
  rows: { denomination: number; note_type: string; count: number }[]
): Promise<void> {
  if (rows.length === 0) return;
  await db
    .insert(walletDenominations)
    .values(
      rows.map((r) => ({
        account_id: accountId,
        user_id: userId,
        denomination: r.denomination,
        note_type: r.note_type,
        count: r.count,
      }))
    )
    .onConflictDoUpdate({
      target: [
        walletDenominations.account_id,
        walletDenominations.denomination,
        walletDenominations.note_type,
      ],
      set: {
        count: db.$count(walletDenominations),  // placeholder — lihat note
      },
    });
}
```

> **Note onConflictDoUpdate:** Drizzle v0.x tidak support `sql\`excluded.count\`` langsung via helper — pakai raw SQL:
> ```ts
> set: { count: sql\`excluded.count\`, updated_at: sql\`now()\` }
> ```
> Import `sql` dari `drizzle-orm`.

---

## Task 3 — Server Actions: `src/app/(app)/accounts/[id]/actions.ts`

```ts
"use server";

import { requireUser } from "@/lib/accessControlServer";
import { ServerActionResult } from "@/lib/errorUtils";
import {
  getWalletDenominations,
  upsertWalletDenominations,
  WalletDenominationRow,
} from "@/db/queries/walletDenominations";
import { getAccountById } from "@/db/queries/accounts";

// Pecahan IDR valid
const VALID_DENOMINATIONS: Record<string, number[]> = {
  paper: [100000, 50000, 20000, 10000, 5000, 2000, 1000],
  coin: [1000, 500, 200, 100, 50],
};

export async function getWalletDenominationsAction(
  accountId: string
): Promise<ServerActionResult<WalletDenominationRow[]>> {
  try {
    const user = await requireUser();
    // Verifikasi ownership akun
    const account = await getAccountById(user.id, accountId);
    if (!account) return { success: false, message: "Akun tidak ditemukan" };
    if (!account.is_wallet) return { success: false, message: "Bukan akun wallet" };
    const data = await getWalletDenominations(user.id, accountId);
    return { success: true, data };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Gagal memuat" };
  }
}

export async function upsertWalletDenominationsAction(
  accountId: string,
  rows: { denomination: number; note_type: string; count: number }[]
): Promise<ServerActionResult<void>> {
  try {
    const user = await requireUser();
    const account = await getAccountById(user.id, accountId);
    if (!account) return { success: false, message: "Akun tidak ditemukan" };
    if (!account.is_wallet) return { success: false, message: "Bukan akun wallet" };

    // Validasi setiap row
    for (const row of rows) {
      if (row.count < 0) return { success: false, message: "Jumlah tidak boleh negatif" };
      const valid = VALID_DENOMINATIONS[row.note_type];
      if (!valid || !valid.includes(row.denomination)) {
        return { success: false, message: `Pecahan tidak valid: ${row.denomination}` };
      }
    }

    await upsertWalletDenominations(user.id, accountId, rows);
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Gagal menyimpan" };
  }
}
```

> **Perlu cek:** apakah `getAccountById` ada di `src/db/queries/accounts.ts` dan return field `is_wallet`. Kalau belum ada fungsi ini, grep dulu, mungkin namanya beda.

---

## Task 4 — TanStack hook: `src/app/(app)/accounts/[id]/_hooks/useWalletDenominations.ts`

```ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { walletDenominationKeys, accountKeys, dashboardKeys } from "@/lib/query";
import {
  getWalletDenominationsAction,
  upsertWalletDenominationsAction,
} from "../actions";

export function useWalletDenominations(accountId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: walletDenominationKeys.byAccount(accountId),
    queryFn: async () => {
      const res = await getWalletDenominationsAction(accountId);
      if (!res.success) throw new Error(res.message);
      return res.data!;
    },
  });

  const mutation = useMutation({
    mutationFn: (rows: { denomination: number; note_type: string; count: number }[]) =>
      upsertWalletDenominationsAction(accountId, rows),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletDenominationKeys.byAccount(accountId) });
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(accountId) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });

  return { query, mutation };
}
```

---

## Task 5 — Component: `src/app/(app)/accounts/[id]/_components/WalletDenominations.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { useWalletDenominations } from "../_hooks/useWalletDenominations";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/helper";

// Denominasi IDR standar — urutan tampil di grid
const DENOMINATION_GROUPS = [
  {
    label: "Uang Kertas",
    note_type: "paper",
    denominations: [100000, 50000, 20000, 10000, 5000, 2000, 1000],
  },
  {
    label: "Koin",
    note_type: "coin",
    denominations: [1000, 500, 200, 100, 50],
  },
];

interface Props {
  accountId: string;
  currentBalance: number;
}

type DenomKey = `${string}-${number}`; // "paper-100000"

export function WalletDenominations({ accountId, currentBalance }: Props) {
  const { query, mutation } = useWalletDenominations(accountId);
  const [counts, setCounts] = useState<Record<DenomKey, number>>({});

  // Prefill dari DB saat data load
  useEffect(() => {
    if (!query.data) return;
    const map: Record<DenomKey, number> = {};
    for (const row of query.data) {
      map[`${row.note_type}-${row.denomination}` as DenomKey] = row.count;
    }
    setCounts(map);
  }, [query.data]);

  const getCount = (note_type: string, denom: number) =>
    counts[`${note_type}-${denom}` as DenomKey] ?? 0;

  const setCount = (note_type: string, denom: number, value: string) => {
    const n = parseInt(value.replace(/\D/g, "")) || 0;
    setCounts((prev) => ({ ...prev, [`${note_type}-${denom}`]: n }));
  };

  const total = DENOMINATION_GROUPS.reduce((sum, g) =>
    sum + g.denominations.reduce((s, d) => s + getCount(g.note_type, d) * d, 0), 0
  );

  const diff = total - currentBalance;

  const handleSave = () => {
    const rows = DENOMINATION_GROUPS.flatMap((g) =>
      g.denominations.map((d) => ({
        denomination: d,
        note_type: g.note_type,
        count: getCount(g.note_type, d),
      }))
    );
    mutation.mutate(rows);
  };

  if (query.isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
      <h2 className="text-base font-semibold text-gray-800">Pecahan Fisik</h2>

      {/* Summary */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total pecahan</span>
          <span className="font-semibold text-blue-600">{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Saldo tercatat</span>
          <span className="font-semibold">{formatCurrency(currentBalance)}</span>
        </div>
        <div
          className={`flex justify-between text-sm pt-2 border-t ${
            diff === 0 ? "text-green-600" : diff > 0 ? "text-blue-600" : "text-red-600"
          }`}
        >
          <span>Selisih</span>
          <span className="font-bold">
            {diff === 0 ? "Cocok!" : formatCurrency(diff, "signs")}
          </span>
        </div>
      </div>

      {/* Grid pecahan */}
      {DENOMINATION_GROUPS.map((g) => (
        <div key={g.note_type}>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            {g.label}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {g.denominations.map((denom) => (
              <div key={denom} className="p-2 bg-gray-50 rounded-lg flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-green-700 bg-green-100 rounded px-1">
                  {(denom / 1000).toLocaleString("id-ID")}rb
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={getCount(g.note_type, denom) || ""}
                  onChange={(e) => setCount(g.note_type, denom, e.target.value)}
                  placeholder="0"
                  className="w-full text-center text-sm border border-gray-200 rounded p-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <Button
        onClick={handleSave}
        disabled={mutation.isPending}
        className="w-full"
      >
        {mutation.isPending ? "Menyimpan..." : "Update Wallet"}
      </Button>

      {mutation.isSuccess && (
        <p className="text-sm text-green-600 text-center">Tersimpan!</p>
      )}
      {mutation.isError && (
        <p className="text-sm text-red-500 text-center">
          {mutation.error instanceof Error ? mutation.error.message : "Gagal menyimpan"}
        </p>
      )}
    </div>
  );
}
```

---

## Task 6 — Integrasi di `src/app/(app)/accounts/[id]/page.tsx`

Tambah import:
```ts
import { WalletDenominations } from "./_components/WalletDenominations";
```

Setelah `<RealityCheckForm ... />`, tambah:
```tsx
{account.is_wallet && (
  <WalletDenominations
    accountId={id}
    currentBalance={account.current_balance}
  />
)}
```

---

## Pre-flight Checks

1. **Cek `getAccountById` di `src/db/queries/accounts.ts`** — pastikan exists dan return `is_wallet`.
2. **Cek `walletDenominations` export di `src/db/schema.ts`** — sudah ada (verified).
3. **`sql` import di walletDenominations.ts** — `import { and, eq, sql } from "drizzle-orm"`.

---

## Verifikasi

1. Login → `/accounts/[id]` untuk akun **Wallet** → section "Pecahan Fisik" muncul di bawah RealityCheckForm
2. Akun non-wallet (BCA, Mandiri) → section tidak muncul
3. Input count beberapa denomination → total update live (otomatis dari state)
4. Klik "Update Wallet" → success message → reload halaman → count masih tersimpan
5. Input count negatif tidak bisa (input type tel hanya digit)
6. Server validation: denomination invalid → error message tampil

---

## CLAUDE.md Check
- [ ] Pattern baru? Tidak — ikuti pattern yang sudah ada (query/action/hook/component)
- [ ] Tabel baru? Tidak — `wallet_denominations` sudah ada
- [ ] Route baru? Tidak — section di route yang sudah ada
- [ ] Permission pattern baru? Tidak
