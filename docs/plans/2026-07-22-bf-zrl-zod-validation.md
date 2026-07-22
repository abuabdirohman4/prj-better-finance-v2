# Plan: Zod Validation Server Actions (bf-zrl)

**Date:** 2026-07-22
**Issue:** bf-zrl · P1 Security
**Files baru:** `src/lib/schemas/transaction.ts`, `src/lib/schemas/account.ts`
**Files diubah:** `src/app/(app)/transactions/actions.ts`, `src/app/(app)/accounts/actions.ts`

## Context

Server Actions terima TS types yang dihapus saat compile → 0 validasi runtime. zod terpasang tapi 0 dipakai. bf-ydb fix guard logis manual; bf-zrl ini tambah zod schema sebagai layer formal di semua trust boundary.

**Prioritas file:**
- `createTransactionAction`, `updateTransactionAction` — mutasi financial, paling kritis
- `createAccountAction`, `updateAccountAction` — CRUD akun

## Task 1 — Buat `src/lib/schemas/transaction.ts`

```ts
import { z } from "zod";

export const transactionTypeSchema = z.enum(["spending", "earning", "transfer"]);

export const createTransactionSchema = z.object({
  account_id: z.string().uuid("ID akun tidak valid"),
  to_account_id: z.string().uuid("ID akun tujuan tidak valid").optional(),
  transaction_type: transactionTypeSchema,
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  note: z.string().min(1, "Catatan wajib diisi"),
  category_id: z.string().uuid().optional().nullable(),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid"),
});

export const updateTransactionSchema = createTransactionSchema.partial().extend({
  // to_account_id bisa di-unset (null) saat ganti tipe dari transfer
  to_account_id: z.string().uuid().optional().nullable(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
```

## Task 2 — Buat `src/lib/schemas/account.ts`

```ts
import { z } from "zod";

export const createAccountSchema = z.object({
  name: z.string().min(1, "Nama akun wajib diisi").max(50),
  account_type_id: z.string().uuid("Tipe akun tidak valid"),
  initial_balance: z.number().min(0, "Saldo awal tidak boleh negatif"),
  is_wallet: z.boolean().optional().default(false),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const updateAccountSchema = createAccountSchema.partial();
```

## Task 3 — Pakai zod di `createTransactionAction` + `updateTransactionAction`

Di `src/app/(app)/transactions/actions.ts`, import:
```ts
import { createTransactionSchema, updateTransactionSchema } from "@/lib/schemas/transaction";
```

Di awal `createTransactionAction` (setelah `requireUser()`):
```ts
const parsed = createTransactionSchema.safeParse(input);
if (!parsed.success) {
  return { success: false, message: parsed.error.errors[0].message };
}
const validInput = parsed.data;
// ganti semua akses `input.xxx` → `validInput.xxx` di bawahnya
```

Di awal `updateTransactionAction` (setelah fetch `old`):
```ts
const parsed = updateTransactionSchema.safeParse(input);
if (!parsed.success) {
  return { success: false, message: parsed.error.errors[0].message };
}
const validInput = parsed.data;
```

> Catatan: Setelah zod parse, type `CreateTransactionInput` dari `@/db/queries/transactions` dan dari schema bisa konflik. Cek apakah tipe di queries sama — kalau berbeda, pakai type dari schema (yang ada runtime guarantee).

## Task 4 — Pakai zod di `createAccountAction` + `updateAccountAction`

Di `src/app/(app)/accounts/actions.ts`, import:
```ts
import { createAccountSchema, updateAccountSchema } from "@/lib/schemas/account";
```

Pola sama: `safeParse(input)` di awal action, return error jika gagal.

## Verifikasi

1. Kirim amount negatif via direct action call → `{ success: false, message: "Jumlah harus lebih dari 0" }`
2. Kirim transaction_type = "random" → rejected
3. Kirim transaction_date = "not-a-date" → rejected
4. Normal flow masih jalan (regression test manual)

## CLAUDE.md Check
- [ ] Pattern baru: zod schema di `src/lib/schemas/` — tambah catatan ke AGENTS.md section "Server Actions"
- [ ] Tabel/route baru? Tidak
