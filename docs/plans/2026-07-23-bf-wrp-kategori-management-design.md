# bf-wrp — Category Management (CRUD Kategori + Group)

Date: 2026-07-23
Status: Design approved (brainstorm)
Issue: bf-wrp

## Problem

User tidak bisa kelola kategori — cuma seed `DEFAULT_CATEGORIES` saat signup. Tidak ada create/edit/delete di mana pun. Group juga hardcode di `CATEGORY_GROUP_LABELS` (TS map), tidak bisa custom.

Schema `categories` sudah punya `is_active`, `is_system`, `sort_order`, `group_name` → soft-delete + custom kategori sudah schema-ready. Gap = tabel group + UI/CRUD.

## Decisions

### 1. Lokasi: inline di Budget page
Tombol ⚙ **"Manage Categories"** di halaman Budget (tempat kategori paling kepakai).

### 2. Custom group → tabel `category_groups` baru
Sekarang `categories.group_name` = text bebas, label/urutan hardcode TS. Pindah ke tabel:

```
category_groups
  id           uuid pk
  user_id      uuid fk userProfiles
  name         text        -- label tampil (bebas rename)
  slug         text        -- identitas kode (guard: 'earning')
  sort_order   integer
  is_system    boolean     -- true untuk 6 default seed
  is_active    boolean
  created_at   timestamptz
  unique(user_id, slug)
```

- `categories.group_name` (text) → migrasi jadi `group_id` FK ke `category_groups`.
- Migration: buat tabel + seed 6 default (`is_system=true`) + backfill `group_id` dari `group_name` existing.
- 6 default seed: eating/living/saving/investing/giving/earning (label: Makan/Hidup/Tabungan/Investasi/Beri/Pendapatan).
- `CATEGORY_GROUP_LABELS` (TS map) dipensiunkan setelah label pindah ke tabel.

### 3. CRUD Kategori
- **Tambah/edit:** nama + pilih group + (opsional icon/warna/sort_order).
- **Hapus (dipakai transaksi):** dialog 2 opsi:
  - **Nonaktifkan** (default) → `is_active=false`, transaksi lama tetap nunjuk kategori (history utuh), hilang dari picker baru.
  - **Pindahkan** → pilih kategori pengganti, bulk-update transaksi lama, lalu hapus permanen.
- **Hapus (kosong / 0 tx):** langsung permanen tanpa nanya.
- Kategori dalam group `earning` (Salary/Allowance/dll): **CRUD penuh** — tidak ada guard di level kategori.

### 4. CRUD Group
- **Custom group:** tambah/edit/hapus bebas.
- **Hapus group berisi kategori:** dialog — Pindahkan kategori ke group lain lalu hapus / Nonaktifkan group.
- **Hapus group kosong:** langsung.
- **Rename:** semua group boleh (termasuk 6 default) — cuma label.
- **Hapus guard:** group `earning` **TIDAK bisa dihapus** (boleh rename). Kode andelin slug `earning` di `TransactionForm.tsx:98` (`c.group_name === "earning"` misahkan kategori income vs expense di form transaksi). 5 default lain + custom: hapus bebas via flow di atas.

## Guard Summary

| Level | earning | 5 default lain | custom |
|---|---|---|---|
| Group rename | ✓ | ✓ | ✓ |
| Group hapus | ✗ (guard slug) | ✓ | ✓ |
| Kategori dalamnya CRUD | ✓ penuh | ✓ penuh | ✓ penuh |

## Files Touched (estimasi)

| File | Perubahan |
|---|---|
| `db/schema.ts` + migration | tabel `category_groups`, `categories.group_id` FK, seed+backfill |
| `db/queries/categories.ts` (baru/extend) | CRUD kategori + group, join group |
| `db/queries/budgets.ts`, `accounts.ts` | select `group_id`/join group (ganti `group_name`) |
| `budgets/page.tsx` | tombol Manage Categories + grouping pakai group table |
| `budgets/_components/CategoryManager*.tsx` (baru) | UI list + CRUD kategori & group |
| `transactions/_components/TransactionForm.tsx:98` | filter earning tetap by group slug (guard aman) |
| `lib/constants.ts` | pensiunkan `CATEGORY_GROUP_LABELS` (opsional, setelah migrasi) |

## Debt

UI wording Indonesian — AGENTS.md English-first. Translate saat i18n pass global.
