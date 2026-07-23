# Plan: cursor-pointer di semua elemen clickable (bf-lp4)

**Date:** 2026-07-23
**Issue:** bf-lp4 · P3 Task
**Scope:** Semua elemen bisa di-klik tampil `cursor: pointer` saat hover. Root fix di base `Button`, sisanya raw element manual.

---

## Hasil Audit (22 file punya onClick)

Klasifikasi:
1. **Base `Button` component** (`src/components/ui/Button.tsx`) — render `<button>` sendiri. Tambah `cursor-pointer` sekali di base → SEMUA pemakai `<Button>` auto dapat. Ini fix terbesar & termurah.
2. **Raw `<button>`** (bukan via `<Button>`) — ~28 elemen di 18 file (X close, tab pill, ikon aksi). Manual per elemen.
3. **`<div onClick>`** — ~8. Sebagian = backdrop overlay (TIDAK perlu cursor-pointer, bukan "tombol"), sebagian = card clickable (perlu). Judgment per kasus.
4. **Sudah `cursor-pointer`** — skip: `Fab.tsx`, `TransactionCard.tsx`, `BudgetGroup.tsx`, `ConfirmDialog.tsx`, dan sebagian page.

---

## Task 1 — Base Button (fix terbesar, 1 edit)

File: `src/components/ui/Button.tsx`

Tambah `cursor-pointer` ke class base di dalam `cn(...)`. Juga tambah `disabled:cursor-not-allowed` supaya state disabled tidak salah kasih pointer.

```tsx
// di cn() base classes, tambahkan:
"cursor-pointer disabled:cursor-not-allowed disabled:opacity-…"  // sesuaikan dgn existing
```

**Efek:** semua `<Button>` di seluruh app auto benar. Cek existing disabled styling dulu, jangan duplikat.

---

## Task 2 — Raw `<button>` per file (manual)

Tambah `cursor-pointer` ke `className` tiap raw `<button onClick=...>`. File & jumlah (dari audit):

| File | rawBtn |
|---|---|
| `accounts/[id]/_components/WalletDenominations.tsx` | 1 |
| `accounts/[id]/page.tsx` | 1 |
| `accounts/_components/AccountBottomSheet.tsx` | 5 |
| `accounts/page.tsx` | 1 |
| `budgets/_components/BudgetBottomSheet.tsx` | 2 |
| `budgets/_components/BudgetCard.tsx` | 1 |
| `budgets/page.tsx` | 1 |
| `budgets/weekly/page.tsx` | 1 |
| `goals/_components/GoalBottomSheet.tsx` | 1 |
| `goals/_components/GoalCard.tsx` | 1 |
| `goals/_components/GoalCategoryCard.tsx` | 1 |
| `goals/page.tsx` | 1 |
| `page.tsx` (dashboard) | 1 |
| `transactions/_components/FilterBar.tsx` | 1 |
| `transactions/_components/TransactionBottomSheet.tsx` | 2 |
| `transactions/_components/TransactionForm.tsx` | 1 |
| `components/ui/MultiSelect.tsx` | 3 |

> **MultiSelect (3):** dropdown trigger + option + clear button. Sering diklik — WAJIB.
> Kalau raw `<button>` sudah dalam elemen yang di-refactor jadi `<Button>`, boleh ganti ke `<Button variant="ghost">` (dapat cursor otomatis) — tapi JANGAN over-refactor, tempel `cursor-pointer` cukup untuk X close / ikon kecil.

---

## Task 3 — `<div onClick>` (judgment)

File dgn div clickable: `AccountBottomSheet` (1), `BudgetBottomSheet` (1), `GoalBottomSheet` (2), `TransactionBottomSheet` (1).

Aturan:
- **Backdrop overlay** (`onClick={onClose}` di div full-screen bg-black/40) → TIDAK tambah cursor-pointer (bukan tombol, klik-luar-tutup adalah affordance tersembunyi standar).
- **Card / row clickable** (buka detail, pilih item) → tambah `cursor-pointer`.

Cek tiap div satu per satu, jangan pukul rata.

---

## Verifikasi

1. `pnpm tsc --noEmit` → 0 error (perubahan className tak ubah tipe, harusnya aman).
2. Hover manual: semua button, X close, tab pill, dropdown → cursor jadi tangan.
3. Hover disabled button → cursor NOT-allowed, bukan pointer.
4. Hover backdrop overlay → cursor default (bukan pointer).

---

## Catatan
- Ini polish GLOBAL, terpisah dari bf-4ln. Commit sendiri.
- `ConfirmDialog.tsx` sudah ada cursor-pointer (ditambah user manual) — nanti kalau base Button sudah fix, `cursor-pointer` per-className di ConfirmDialog jadi redundant, boleh dibuang (opsional, tak wajib).
