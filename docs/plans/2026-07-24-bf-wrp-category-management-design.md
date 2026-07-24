# Design: Category Management (bf-wrp)

**Status:** Approved 2026-07-24
**Issue:** bf-wrp — brainstorm+feat: kategori management (user tambah/edit/hapus kategori)

## Problem

User TIDAK bisa kelola kategori — cuma di-seed `DEFAULT_CATEGORIES` saat signup. Tidak ada create/edit/delete category di mana pun.

## Keputusan Brainstorm

| Pertanyaan | Keputusan |
|---|---|
| Lokasi UI | Halaman baru `/budgets/categories`, entry tombol "Manage Categories" di `/budgets` |
| Scope | Full CRUD (add + edit + hapus) |
| Delete | **Soft delete** (`is_active=false`) — transaksi/budget lama utuh |
| Kategori sistem (`is_system`) | Diabaikan — semua kategori boleh edit/hapus |
| Grup custom | **Ya** — free-text, pilih 6 existing atau ketik baru |
| Bentuk UI | Full-page list per grup + CategoryBottomSheet buat add/edit |

## Fakta Kunci Codebase

- Tabel `categories` (`src/db/schema.ts:104`) SUDAH lengkap: `is_active`, `is_system`, `sort_order`, `group_name` (text/free), `icon_name`, `color_hex`. **Zero migration.**
- `getCategories` (`src/db/queries/accounts.ts:288`) sudah filter `is_active=true` + `orderBy(sort_order)`. Soft delete otomatis ke-handle picker.
- `CATEGORY_GROUP_LABELS` (`src/lib/constants.ts:28`) cuma didefinisi, TIDAK dipakai runtime. `BudgetGroup` (`_components/BudgetGroup.tsx:46`) render `group` mentah + `capitalize` + `GROUP_ICONS[group] || fallback`. Grup custom **sudah** graceful — no extra work.
- FK `transactions.category_id` / `budgets.category_id` → `categories.id` (plain reference, no cascade). Soft delete menghindari FK violation & jaga histori.
- Unique constraint: `(user_id, slug, group_name)`.

## Arsitektur

### Data layer — `src/db/queries/categories.ts` (baru)
- `getAllCategoriesGrouped(userId)` → semua kategori aktif user, grouped by `group_name` (buat halaman manage; beda dari `getCategories` yang flat buat picker).
- `createCategory(userId, {name, group_name})` → slug auto dari name (kebab), `sort_order` = max(user)+1, `is_active=true`, `is_system=false`.
- `updateCategory(userId, id, {name, group_name})` → filter `user_id`, regen slug.
- `softDeleteCategory(userId, id)` → set `is_active=false`, filter `user_id`.
- Semua WAJIB `where(eq(categories.user_id, userId))`.

### Schema — `src/lib/schemas/category.ts` (baru)
zod: `name` (required, trim, non-empty), `group_name` (required). Pesan English.

### Server actions — `src/app/(app)/budgets/actions.ts` (ubah, tambah 3)
`createCategoryAction`, `updateCategoryAction`, `deleteCategoryAction`.
Pattern: `requireUser()` → validasi zod → query → `handleApiError(e, "context")` → `ServerActionResult`.

### Page — `src/app/(app)/budgets/categories/page.tsx` (baru)
Page Pattern: `"use client"`, header gradient+wave (copy pola budgets), back button ke `/budgets`, list per grup (nama grup capitalize + baris kategori), tiap baris tombol ✏️ + 🗑, FAB/tombol "+ Add Category".

### Bottom sheet — `_components/CategoryBottomSheet.tsx` (baru)
Form add/edit: `name` (Input) + `group_name` (SingleSelect existing groups + opsi ketik grup baru) + tombol hapus (edit mode, konfirmasi). Pola dari `BudgetBottomSheet.tsx`.

### Hook — `_hooks/useManageCategories.ts` (baru)
Query grouped + mutation create/update/delete, invalidate `categoryKeys` (biar picker transaksi/budget refresh).

### Entry — `src/app/(app)/budgets/page.tsx` (ubah)
Tombol "Manage Categories" (Link → `/budgets/categories`) deket judul "Budget Spending" atau header.

## Testing
- Unit: slug generation (nama → kebab), soft-delete filter (kategori inactive gak muncul di `getCategories`).
- Manual: create→muncul picker; edit nama→transaksi lama ikut nama baru; hapus→hilang picker, transaksi lama tetap tampil; grup custom→muncul as new group di `/budgets`.

## Non-tujuan (YAGNI)
- Reorder drag-drop (sort_order manual) — skip.
- Restore kategori terhapus — skip (via DB kalau perlu).
- Edit icon/warna — skip (kolom ada, belum dipakai UI).
- Guard `is_system` — skip (semua boleh edit/hapus).

## CLAUDE.md / AGENTS.md Check
- [ ] Route baru `/budgets/categories` → tambah ke "Feature Pages" AGENTS.md.
- [ ] Pattern kategori management (soft delete, grup free-text) → dokumentasi AGENTS.md kalau perlu.
- [ ] `getAllCategoriesGrouped` vs `getCategories` distinction → catat.
