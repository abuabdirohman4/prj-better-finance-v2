# Plan: Migrasi Data Sheet 2025-2026 (bf-bwh)

**Date:** 2026-07-23
**Issue:** bf-bwh · P3 Feature
**Scope:** Import transaksi + akun + goals dari Google Sheet (tahun 2025 & 2026) ke Postgres v2.

---

## Context

Sistem sheet v1 = double-entry accounting. Baca `docs/konsep-keuangan.md` + memory `v1-financial-system-architecture` DULU. Sheet machine-readable sejak 2025. 1 file spreadsheet = 1 tahun (SHEET_ID beda).

**PRASYARAT:** bf-4ln SELESAI dulu (transactions.goal_id ada) supaya transaksi bisa ter-tag goal saat import.

**Sheet ID:**
- 2026: `1mVgdePlteuewjY6DvdUmNyHf0CPoAoHY3Sh3lDymV5A`
- 2025: (user isi — beda file, tanya user saat mulai)

**Fetch endpoint (gviz, sheet share publik):**
```
https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:csv&sheet=<Tab>
```

**Header transaksi bulanan (tab Jan..Dec):**
```
Date | Transaction | Account | Category | Note | Wallet | ATM | Platform | Investment | Saving | AR | AP | NP | OI | RE | NET
```

---

## Strategi: Script Node, BUKAN fitur app

Migrasi = one-off script `scripts/migrate-sheet.ts`, dijalankan manual (`pnpm tsx scripts/migrate-sheet.ts <year>`). BUKAN UI/route. Idempotent via `import_row_hash` (kolom SUDAH ada di transactions).

---

## Mapping kolom sheet → v2

| Sheet | v2 `transactions` |
|---|---|
| `Date` | `transaction_date` (parse `d/m/yyyy` → ISO) |
| `Transaction` | `transaction_type` (Earning/Spending/Transfer — samakan casing dengan v2 existing) |
| `Account` | `account_id` (lookup by name → accounts.id; buat akun jika belum ada) |
| `Category` | `category_id` (lookup by name → categories.id; buat jika belum ada) |
| `Note` | `note` |
| kolom bucket (Wallet..NET) | tentukan `amount` + `to_account_id` (lihat aturan bawah) |
| — | `is_imported = true`, `source_month = <tab>`, `import_row_hash = hash(row)` |

### Aturan amount + type (dari kolom bucket)

- **Earning**: amount = nilai positif di kolom kas/tujuan (mis. ATM/Platform). type=earning, to_account_id=null.
- **Spending**: amount = |nilai negatif| di kolom kas. type=spending.
- **Transfer**: ada 2 kolom terisi (satu -, satu +). account = kolom sumber (-), to_account = kolom tujuan (+). amount = |nilai|.
  - Jika tujuan = kolom Saving/Investment yang cocok goal (match Account+Category lama) → set `goal_id` (lookup goal by name/account+category). Kalau tak ketemu goal, biarkan goal_id null.

> Kolom equity/liability (OI/RE/NET/AP/NP) = fondasi akuntansi laten — untuk migrasi personal v2, FOKUS ke kas + Saving/Investment. Kolom equity JANGAN dipaksa masuk transactions v2 (belum ada model-nya). Catat sebagai TODO kalau nanti mode bisnis aktif.

---

## Task 1 — Setup script + fetch (`scripts/migrate-sheet.ts`)

```ts
// pnpm tsx scripts/migrate-sheet.ts 2026
// fetch tiap tab bulan, parse CSV (papaparse), kumpulkan rows
```
- Pakai `papaparse` (sudah dep v1; cek/instal di v2).
- Fetch tab: `Jan`,`Feb`,...,`Dec` (skip yang kosong/error).
- Env: butuh DB connection (pakai `src/db` yang sudah ada, atau `drizzle` langsung dengan DATABASE_URL).

## Task 2 — Resolve akun & kategori

- Ambil semua `accounts` + `categories` user dari DB → map by name (lowercase trim).
- Row dengan Account/Category baru → INSERT dulu (accounts: asset_category default liquid; categories: type sesuai). Log yang dibuat.

## Task 3 — Transform row → transaction insert

- Terapkan aturan amount+type di atas.
- `import_row_hash` = sha256(`${date}|${type}|${account}|${category}|${note}|${amount}`). Cek existing sebelum insert (idempotent).
- Balance: JANGAN pakai RPC per-row (lambat + double-count). Setelah semua insert, hitung ulang `accounts.current_balance` dari SUM transaksi, ATAU pakai Summary sheet sebagai source of truth saldo akhir → set current_balance langsung.

## Task 4 — Migrasi goals

- Fetch tab `Goals`. Tiap baris → upsert `savings_goals` (name, goal_type map Saving/Investment, target_amount, monthly_contribution, linked_account_id by Account name, deadline_date).
- `collected_amount` awal: pakai kolom `Collected` sheet sebagai opening balance (karena transaksi historis mungkin tak semua ter-tag goal_id).

## Task 5 — Verifikasi

- Bandingkan total saldo per akun (v2 hasil migrasi) vs Summary sheet. Selisih = log warning.
- Jumlah transaksi per bulan cocok jumlah baris sheet.
- Dry-run mode: `--dry` → print rencana insert tanpa commit ke DB.

---

## Catatan penting

- 2020-2024 DITUNDA (belum machine-readable). Script ditulis untuk format 2025+.
- Jalankan 2026 dulu, verifikasi, baru 2025.
- Backup DB sebelum run non-dry (atau test di branch Supabase).

---

## CLAUDE.md Check
- [ ] Pattern baru: migration script di `scripts/`. Tambah ke docs kalau jadi konvensi.
- [ ] `import_row_hash` + `is_imported` dedup pattern — dokumentasi jika belum ada.
