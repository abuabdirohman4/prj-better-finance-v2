# Plan: Goals-Transactions Integration (bf-4ln)

**Date:** 2026-07-23
**Issue:** bf-4ln · P2 Feature
**Scope:** Hubungkan transaksi ke goal — `goal_id` di transactions, `collected_amount` derived, transfer UI grup Akun/Goals.

---

## Context

Ini fitur pembeda Better Finance: transaksi = source of truth, goals derived darinya. Baca `docs/architecture-integration.md` + `docs/konsep-keuangan.md` §5 dulu.

**DB SUDAH DISIAPKAN (via MCP, jangan ulang):**
- `transactions.goal_id` UUID nullable FK → `savings_goals(id)` ON DELETE SET NULL — SUDAH ADA.
- Index `idx_transactions_goal_id` — SUDAH ADA.
- `savings_goals.goal_type` constraint = `['Saving','Investment']` — SUDAH diubah (dari Investing).
- Drizzle schema `src/db/schema.ts` transactions.goal_id — SUDAH ditambah.
- Zod + semua UI ref `Investing`→`Investment` — SUDAH diganti.

Jadi task ini **murni kode aplikasi**, tidak perlu MCP/migration lagi.

**Prinsip goal:**
- Goal terikat akun via `linked_account_id` (kantong = goal, 1 akun banyak goal).
- Transfer pilih goal = transfer ke `goal.linked_account_id` + set `transactions.goal_id`.
- `collected_amount` = `SUM(transactions.amount WHERE goal_id = X AND transaction_type = 'Transfer' AND deleted_at IS NULL)`.

---

## Keputusan desain: collected_amount = DERIVED (compute on-read)

JANGAN pakai kolom cache. Compute saat query `getGoals` via subquery/leftJoin SUM. Alasan: konsistensi (tidak ada risiko cache basi), volume transaksi personal kecil (performa non-isu). Kolom `savings_goals.collected_amount` tetap ada di DB (untuk seed/manual override awal) tapi TIDAK dipakai untuk display — display pakai hasil SUM. Jika goal punya transaksi ter-tag, pakai SUM; jika belum ada transaksi sama sekali, fallback ke kolom `collected_amount` (data manual lama).

Formula display:
```
collected = COALESCE(SUM(txn.amount WHERE goal_id), 0) + collected_amount_manual_base
```
> SEDERHANAKAN: untuk v1 integrasi, `collected = SUM(txn ter-tag)`. Kolom manual `collected_amount` jadi "saldo awal" (opening balance) yang ditambahkan. Mayoritas goal baru = 0 manual + SUM txn.

---

## Task 1 — Update `getGoals` query (derived collected)

File: `src/db/queries/goals.ts`

Ganti `collected_amount` select dari kolom langsung jadi: `collected_amount (opening) + SUM(transactions ter-tag)`.

```ts
// tambah import
import { transactions } from "@/db/schema";
import { and, eq, desc, sql, isNull } from "drizzle-orm";

// di getGoals, ganti collected_amount jadi opening + derived
// Pakai subquery correlated SUM:
collected_amount: sql<number>`
  ${savingsGoals.collected_amount}::numeric
  + COALESCE((
      SELECT SUM(t.amount)
      FROM transactions t
      WHERE t.goal_id = ${savingsGoals.id}
        AND t.transaction_type = 'Transfer'
        AND t.deleted_at IS NULL
    ), 0)
`,
```

Sisanya (percent calc, leftJoin accounts) tetap.

**Acceptance:** goal dengan transaksi ter-tag `goal_id` menampilkan collected = opening + jumlah transfer.

---

## Task 2 — `getGoalsForSelect` (untuk dropdown transfer)

File: `src/db/queries/goals.ts` — tambah fungsi ringan.

```ts
export interface GoalSelectRow {
  id: string;
  name: string;
  linked_account_id: string | null;
  linked_account_name: string | null;
  goal_type: string;
}

export async function getGoalsForSelect(userId: string): Promise<GoalSelectRow[]> {
  return db
    .select({
      id: savingsGoals.id,
      name: savingsGoals.name,
      linked_account_id: savingsGoals.linked_account_id,
      linked_account_name: accounts.name,
      goal_type: savingsGoals.goal_type,
    })
    .from(savingsGoals)
    .leftJoin(accounts, eq(savingsGoals.linked_account_id, accounts.id))
    .where(and(eq(savingsGoals.user_id, userId), eq(savingsGoals.is_active, true)))
    .orderBy(savingsGoals.goal_type, savingsGoals.name);
}
```

Hanya goal dengan `linked_account_id` NOT NULL yang bisa dipakai di transfer (butuh akun tujuan). Filter di action/UI (lihat Task 4).

---

## Task 3 — Server action: getGoalsForTransferAction

File: `src/app/(app)/transactions/actions.ts`

```ts
import { getGoalsForSelect } from "@/db/queries/goals";

export async function getGoalsForTransferAction(): Promise<ServerActionResult<GoalSelectRow[]>> {
  try {
    const user = await requireUser();
    const all = await getGoalsForSelect(user.id);
    // hanya goal yang punya linked_account_id (bisa jadi tujuan transfer)
    return { success: true, data: all.filter((g) => g.linked_account_id) };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}
```

---

## Task 4 — Transfer form: dropdown tujuan grup AKUN + GOALS

File: `src/app/(app)/transactions/_components/TransactionForm.tsx` (atau TransactionBottomSheet — cek mana yang render field to_account).

**Behavior:**
- Saat `transaction_type === 'Transfer'`, field "Tujuan" pakai `SingleSelect` dengan optgroup:
  ```
  AKUN
    <daftar accounts (kecuali akun sumber)>
  GOALS
    <daftar goal dari getGoalsForTransferAction, label "NamaGoal → NamaAkun">
  ```
- Value option: prefix untuk bedakan. Akun = `acc:<accountId>`. Goal = `goal:<goalId>`.
- Saat submit:
  - Jika pilih `acc:X` → `to_account_id = X`, `goal_id = null` (transfer biasa).
  - Jika pilih `goal:Y` → cari goal Y, set `to_account_id = goal.linked_account_id`, `goal_id = Y`.

`SingleSelect` dari `@/components/ui/MultiSelect` mendukung optgroup (prop `options` dengan `group`). Cek signature — jika belum support group, pakai flat options dengan label prefix "🎯 " untuk goals atau tambahkan `group` field.

**Data fetch:** panggil `getGoalsForTransferAction` via hook (TanStack) saat form transfer dibuka. Query key: tambah `transactionKeys.goalsForTransfer()` di `src/lib/query.ts`.

---

## Task 5 — createTransaction / editTransaction terima goal_id

File: `src/app/(app)/transactions/actions.ts` + `src/db/queries/transactions.ts` (atau di mana insert transaksi).

1. Zod schema transaksi (`src/lib/schemas/transaction.ts`): tambah `goal_id: z.string().uuid().optional().nullable()`.
2. Insert/update transactions: sertakan `goal_id`.
3. **Ownership guard:** jika `goal_id` ada, verifikasi goal milik user (`getGoalsForSelect` sudah filter user_id — cek goal_id ada di list) SEBELUM insert. Reject kalau bukan milik user.
4. Balance mutation TETAP: transfer → `-amount` source, `+amount` to_account (= goal.linked_account_id). Tidak berubah, karena goal transfer = transfer biasa ke akun goal + tag goal_id.
5. Edit/delete: saat reverse, goal_id ikut ter-handle otomatis (collected derived dari SUM, jadi hapus transaksi = collected turun sendiri). Tidak perlu logic khusus.

**Acceptance:** buat transfer ke goal → transaksi tersimpan dengan goal_id + saldo akun goal naik → collected goal naik.

---

## Task 6 — Goals page: hapus input manual "Uang Terkumpul" (opsional edit)

File: `src/app/(app)/goals/_components/GoalBottomSheet.tsx`

- Field "Uang Terkumpul Saat Ini" (collected) di edit mode: ubah jadi "Saldo Awal (opening)" dengan helper text "Uang yang sudah terkumpul sebelum pakai app. Kontribusi berikutnya otomatis dari transaksi transfer ke goal ini."
- Create mode: tetap tidak ada field collected (default 0).
- JANGAN hapus field sepenuhnya — jadi opening balance. Nilai ini masuk `collected_amount` kolom (base), SUM txn ditambahkan di atasnya (Task 1).

---

## Task 7 — Query keys + hook wiring

File: `src/lib/query.ts` — tambah:
```ts
transactionKeys.goalsForTransfer = () => [...transactionKeys.all, "goals-for-transfer"] as const;
```
File: hook transaksi (`useTransactions` atau baru) — query `getGoalsForTransferAction` saat transfer.
Invalidate `goalKeys.all` setelah create/edit/delete transaksi (supaya collected goal refresh).

---

## Verifikasi akhir

1. `pnpm tsc --noEmit` → 0 errors.
2. Buat goal "Test" linked ke akun Jago.
3. Input transfer dari Mandiri → pilih tujuan grup GOALS "Test → Jago".
4. Cek: transaksi tersimpan goal_id terisi, saldo Jago +amount, saldo Mandiri -amount.
5. Buka goals page: collected "Test" = amount transfer.
6. Hapus transaksi → collected "Test" kembali turun.
7. Transfer ke akun biasa (grup AKUN) → goal_id null, tidak pengaruh goal.

---

## CLAUDE.md Check
- [x] Pattern baru: transaksi ter-tag goal → collected derived. SUDAH didokumentasi di `docs/architecture-integration.md`.
- [ ] Setelah implementasi: pastikan AGENTS.md pointer masih akurat (sudah ada §Architecture Patterns pointer).
