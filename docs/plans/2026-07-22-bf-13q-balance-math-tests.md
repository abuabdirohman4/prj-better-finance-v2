# Plan: Balance Math Tests updateTransactionAction (bf-13q)

**Date:** 2026-07-22
**Issue:** bf-13q · P2 Task
**Depends on:** bf-ydb (server validation harus selesai dulu)
**Files baru:** `src/app/(app)/transactions/__tests__/balanceMath.test.ts`

## Context

`updateTransactionAction` punya logika balance reverse + apply yang kompleks. Zero test coverage. Kasus paling rawan: ganti type (earning→transfer, transfer→spending). Extrak pure function delta math, test dengan Vitest.

## Task 1 — Extract pure function ke `src/app/(app)/transactions/_lib/balanceDelta.ts`

```ts
export interface BalanceDelta {
  account_id: string;
  delta: number;
}

export function calcUpdateDeltas(
  old: {
    account_id: string;
    to_account_id: string | null;
    transaction_type: "spending" | "earning" | "transfer";
    amount: number;
  },
  next: {
    account_id: string;
    to_account_id: string | null;
    transaction_type: "spending" | "earning" | "transfer";
    amount: number;
  }
): BalanceDelta[] {
  const deltas: BalanceDelta[] = [];

  // Reverse old
  const oldReverse = old.transaction_type === "earning" ? -old.amount : old.amount;
  deltas.push({ account_id: old.account_id, delta: oldReverse });
  if (old.transaction_type === "transfer" && old.to_account_id) {
    deltas.push({ account_id: old.to_account_id, delta: -old.amount });
  }

  // Apply new
  const newDelta = next.transaction_type === "earning" ? next.amount : -next.amount;
  deltas.push({ account_id: next.account_id, delta: newDelta });
  if (next.transaction_type === "transfer" && next.to_account_id) {
    deltas.push({ account_id: next.to_account_id, delta: next.amount });
  }

  return deltas;
}
```

## Task 2 — Refactor `updateTransactionAction` pakai `calcUpdateDeltas`

Replace inline delta logic dengan `calcUpdateDeltas(old, { ...newFields })`.

## Task 3 — Buat test `src/app/(app)/transactions/__tests__/balanceMath.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { calcUpdateDeltas } from "../_lib/balanceDelta";

const ACC_A = "acc-a";
const ACC_B = "acc-b";

describe("calcUpdateDeltas", () => {
  it("earning → spending: reverse earning, apply spending", () => {
    const deltas = calcUpdateDeltas(
      { account_id: ACC_A, to_account_id: null, transaction_type: "earning", amount: 1000 },
      { account_id: ACC_A, to_account_id: null, transaction_type: "spending", amount: 500 }
    );
    // Reverse earning: -1000. Apply spending: -500
    expect(deltas).toContainEqual({ account_id: ACC_A, delta: -1000 });
    expect(deltas).toContainEqual({ account_id: ACC_A, delta: -500 });
  });

  it("spending → transfer: reverse spending, debit + credit", () => {
    const deltas = calcUpdateDeltas(
      { account_id: ACC_A, to_account_id: null, transaction_type: "spending", amount: 1000 },
      { account_id: ACC_A, to_account_id: ACC_B, transaction_type: "transfer", amount: 800 }
    );
    expect(deltas).toContainEqual({ account_id: ACC_A, delta: 1000 });  // reverse spending
    expect(deltas).toContainEqual({ account_id: ACC_A, delta: -800 });  // apply transfer debit
    expect(deltas).toContainEqual({ account_id: ACC_B, delta: 800 });   // apply transfer credit
  });

  it("transfer → earning: reverse both sides, apply earning", () => {
    const deltas = calcUpdateDeltas(
      { account_id: ACC_A, to_account_id: ACC_B, transaction_type: "transfer", amount: 500 },
      { account_id: ACC_A, to_account_id: null, transaction_type: "earning", amount: 600 }
    );
    expect(deltas).toContainEqual({ account_id: ACC_A, delta: 500 });   // reverse transfer debit
    expect(deltas).toContainEqual({ account_id: ACC_B, delta: -500 });  // reverse transfer credit
    expect(deltas).toContainEqual({ account_id: ACC_A, delta: 600 });   // apply earning
  });

  it("edit amount only: same type", () => {
    const deltas = calcUpdateDeltas(
      { account_id: ACC_A, to_account_id: null, transaction_type: "spending", amount: 1000 },
      { account_id: ACC_A, to_account_id: null, transaction_type: "spending", amount: 1500 }
    );
    // Net: +1000 (reverse) -1500 (apply) = -500 net on ACC_A
    const netA = deltas.filter(d => d.account_id === ACC_A).reduce((s, d) => s + d.delta, 0);
    expect(netA).toBe(-500);
  });

  it("edit account: move spending from A to B", () => {
    const deltas = calcUpdateDeltas(
      { account_id: ACC_A, to_account_id: null, transaction_type: "spending", amount: 200 },
      { account_id: ACC_B, to_account_id: null, transaction_type: "spending", amount: 200 }
    );
    expect(deltas).toContainEqual({ account_id: ACC_A, delta: 200 });   // reverse old
    expect(deltas).toContainEqual({ account_id: ACC_B, delta: -200 });  // apply new
  });
});
```

## Task 4 — Jalankan test

```bash
pnpm vitest run src/app/\(app\)/transactions/__tests__/balanceMath.test.ts
```

Semua 5 test harus PASS.

## Verifikasi

```
✓ earning → spending
✓ spending → transfer
✓ transfer → earning
✓ edit amount only
✓ edit account
```

## CLAUDE.md Check
- [ ] Pattern baru: `_lib/` subfolder untuk pure logic di dalam feature folder
- [ ] Test pattern: `__tests__/` co-located dengan feature
