# Plan: Server-Side Validation Transactions (bf-ydb)

**Date:** 2026-07-22
**Issue:** bf-ydb · P1 Bug
**File diubah:** `src/app/(app)/transactions/actions.ts`

## Context

`createTransactionAction` dan `updateTransactionAction` di `src/app/(app)/transactions/actions.ts` tidak punya field-level validation server-side. Client bisa bypass form dan kirim:
- `amount <= 0`
- `account_id === to_account_id` (self-transfer)
- `note` kosong/null

Fix: tambah guard manual di awal tiap action (zod belum wajib di sini — bf-zrl handle itu; ini guard logis).

## Task 1 — Guard di `createTransactionAction` (line ~13-50)

Tambah setelah `requireUser()`, sebelum DB query:

```ts
// ── Validation ────────────────────────────────────────────────────────────
if (!input.note || input.note.trim() === "") {
  return { success: false, message: "Catatan wajib diisi." };
}
if (input.amount <= 0) {
  return { success: false, message: "Jumlah harus lebih dari 0." };
}
if (input.transaction_type === "transfer") {
  if (!input.to_account_id) {
    return { success: false, message: "Akun tujuan wajib diisi untuk transfer." };
  }
  if (input.account_id === input.to_account_id) {
    return { success: false, message: "Akun asal dan tujuan tidak boleh sama." };
  }
}
```

## Task 2 — Guard di `updateTransactionAction` (line ~55-100)

Setelah fetch `old` transaction, sebelum reverse balance:

```ts
// ── Validation ────────────────────────────────────────────────────────────
const newNote = input.note ?? old.note;
const newAmount = input.amount ?? old.amount;
const newType = input.transaction_type ?? old.transaction_type;
const newToId = "to_account_id" in input ? input.to_account_id : old.to_account_id;

if (!newNote || newNote.trim() === "") {
  return { success: false, message: "Catatan wajib diisi." };
}
if (newAmount <= 0) {
  return { success: false, message: "Jumlah harus lebih dari 0." };
}
if (newType === "transfer") {
  if (!newToId) {
    return { success: false, message: "Akun tujuan wajib diisi untuk transfer." };
  }
  const newAccountId = input.account_id ?? old.account_id;
  if (newAccountId === newToId) {
    return { success: false, message: "Akun asal dan tujuan tidak boleh sama." };
  }
}
```

> Variabel `newNote`, `newAmount`, dll sudah dideklarasikan di sini — hapus deklarasi duplikat yang ada di bawahnya dalam fungsi yang sama.

## Verifikasi

1. Coba submit form dengan amount 0 atau negatif → server return error, UI tampilkan pesan
2. Coba transfer ke akun sendiri → server reject
3. Coba submit tanpa note → server reject
4. Normal flow (valid) masih jalan

## CLAUDE.md Check
- [ ] Pattern baru? Tidak
- [ ] Tabel/route baru? Tidak
