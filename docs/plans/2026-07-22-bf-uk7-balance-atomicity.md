# Plan: Balance Write Atomicity (bf-uk7)

**Date:** 2026-07-22
**Issue:** bf-uk7 · P1 Bug
**Approach:** Supabase RPC (PostgreSQL function) untuk bungkus balance mutations dalam satu transaction

## Context

`updateTransactionAction` punya 6 sequential `await adjustAccountBalance` + `updateTransaction` tanpa rollback. pgBouncer transaction mode (port 6543) blokir `BEGIN`/`SAVEPOINT`. Kalau gagal di tengah → saldo korup.

**Solusi pilihan: PostgreSQL function via Supabase RPC**
- Tidak butuh ganti connection string
- Atomic di DB level
- Fallback: switch ke session mode port 5432 (lebih simple tapi butuh env change)

## Task 1 — Buat PostgreSQL function via Supabase MCP

Jalankan SQL ini ke Supabase:

```sql
CREATE OR REPLACE FUNCTION apply_transaction_balances(
  p_adjustments JSONB  -- [{"account_id": "uuid", "delta": 1000}, ...]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  adj JSONB;
BEGIN
  FOR adj IN SELECT * FROM jsonb_array_elements(p_adjustments)
  LOOP
    UPDATE accounts
    SET current_balance = current_balance + (adj->>'delta')::numeric
    WHERE id = (adj->>'account_id')::uuid;
  END LOOP;
END;
$$;
```

> `SECURITY DEFINER` — function jalan sebagai owner, bukan caller. Pastikan RLS tidak blokir.
> Simpan SQL ini juga di `supabase/migrations/` sebagai migration file.

## Task 2 — Buat helper `callApplyTransactionBalances` di `src/db/queries/accounts.ts`

```ts
import { createClient } from "@/lib/supabase/server";

export async function applyTransactionBalancesRpc(
  adjustments: { account_id: string; delta: number }[]
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("apply_transaction_balances", {
    p_adjustments: adjustments,
  });
  if (error) throw new Error(`Balance RPC failed: ${error.message}`);
}
```

## Task 3 — Refactor `createTransactionAction`

Replace 3 sequential `adjustAccountBalance` calls dengan 1 RPC call:

```ts
// Sebelum:
await adjustAccountBalance(user.id, input.account_id, delta);
if (transfer) await adjustAccountBalance(user.id, input.to_account_id, input.amount);

// Sesudah:
const adjustments = [{ account_id: validInput.account_id, delta }];
if (validInput.transaction_type === "transfer" && validInput.to_account_id) {
  adjustments.push({ account_id: validInput.to_account_id, delta: validInput.amount });
}
await applyTransactionBalancesRpc(adjustments);
```

## Task 4 — Refactor `updateTransactionAction`

Kumpulkan semua 4-6 adjustments (reverse old + apply new) dalam 1 array, kirim 1 RPC call:

```ts
const adjustments: { account_id: string; delta: number }[] = [];

// Reverse old
adjustments.push({ account_id: old.account_id, delta: oldReverseDelta });
if (old.transaction_type === "transfer" && old.to_account_id) {
  adjustments.push({ account_id: old.to_account_id, delta: -old.amount });
}

// Apply new
adjustments.push({ account_id: newAccountId, delta: newDelta });
if (newType === "transfer" && newToAccountId) {
  adjustments.push({ account_id: newToAccountId, delta: newAmount });
}

await applyTransactionBalancesRpc(adjustments);
```

## Task 5 — Refactor `deleteTransactionAction` (minor)

```ts
const adjustments = [{ account_id: tx.account_id, delta: reverseDelta }];
if (tx.transaction_type === "transfer" && tx.to_account_id) {
  adjustments.push({ account_id: tx.to_account_id, delta: -tx.amount });
}
await applyTransactionBalancesRpc(adjustments);
```

## Verifikasi

1. Create transaksi normal → balance terupdate benar
2. Update transaksi (ganti amount, ganti type) → balance lama ter-reverse, balance baru ter-apply
3. Delete → balance ter-reverse
4. Test atomicity: tidak bisa simulasi partial failure langsung, tapi fungsi RPC atomic by design

## CLAUDE.md Check
- [ ] Pattern baru: `applyTransactionBalancesRpc` → update AGENTS.md section "Balance Mutation"
- [ ] SQL function baru: perlu di `supabase/migrations/`
