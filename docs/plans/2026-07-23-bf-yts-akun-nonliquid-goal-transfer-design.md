# bf-yts — Akun Non-Liquid + Goal Linkage (Transfer 2-Field)

Date: 2026-07-23
Status: Design approved (brainstorm)
Issue: bf-yts

## Problem

- User cuma bisa bikin akun **liquid** (Bank/Cash/E-wallet). `accounts.asset_category` selalu default `"liquid"` karena form akun tidak expose picker-nya. Non-liquid (investment/property/other) belum bisa dibuat → Net Worth non-liquid & sumber data investasi kosong.
- Goal linkage (`goals.linked_account_id`) mengasumsikan **1 goal = 1 akun**. Transfer form pakai `goal.linked_account_id` sebagai tujuan uang. Ini pecah untuk kasus nyata: 1 goal (Dana Darurat) tersebar di banyak akun (Jago + Bibit).

## Decisions

### 1. Account non-liquid = picker `asset_category` eksplisit
Tambah dropdown **"Kategori Aset"** di form akun (`AccountBottomSheet.tsx`): `Liquid | Investment | Property | Other`. Column DB sudah ada — murni UI. `account_type` (Bank/Platform/dll) tetap terpisah, dipakai visual.

- 🟢 Liquid → Bank/Cash/E-wallet (uang cair)
- 📈 Investment → Reksadana/Crypto/Saham
- 🏠 Property → Emas/Tanah/Rumah
- 📦 Other → BPJS/JHT/lainnya

Default create tetap `liquid`. Edit boleh ubah kategori.

### 2. Goal progress = derive dari transaksi (Model C), bukan linked_account
Progress goal sudah = Σ transfer ber-`goal_id` (lihat `getGoals`). Rincian "goal ini di akun mana" **derive** dari transaksi (group by `account_id`). Multi-akun kehandle otomatis, tanpa junction table.

### 3. Transfer form pisah 2 field
Ganti dropdown gabungan (akun ATAU goal) → dua field terpisah:
- **Ke Akun** (wajib) — tujuan uang asli (Jago/Bibit/dst)
- **Untuk Goal** (opsional) — tagging `goal_id` untuk progress

Contoh multi-akun:
- Transfer 5jt → Ke Akun **Jago**, Untuk Goal **Dana Darurat**
- Transfer 7jt → Ke Akun **Bibit**, Untuk Goal **Dana Darurat**
- collected Dana Darurat = 5 + 7 = 12jt ✓

Rewrite `TransactionForm.tsx:122-132` (hapus routing lewat `linked_account_id`, pakai `to_account_id` dari field "Ke Akun" langsung; `goal_id` dari field "Untuk Goal" opsional).

### 4. Drop `goals.linked_account_id`
Kolom tidak dipakai lagi untuk routing. Hapus sepenuhnya:
- Migration: `ALTER TABLE savings_goals DROP COLUMN linked_account_id`
- Bersihkan `src/db/schema.ts` (line ~197), `src/db/queries/goals.ts`, `getGoalsForTransferAction`, form goal (`GoalBottomSheet.tsx`), `src/lib/schemas/goal.ts`.

### 5. Net Worth non-liquid
Akun non-liquid muncul sebagai kartu per-akun individual di halaman Net Worth (sesuai memory `assets-networth-apar-concept`). Akun liquid tetap teragregat di kartu "Accounts".

## Files Touched (estimasi)

| File | Perubahan |
|---|---|
| `accounts/_components/AccountBottomSheet.tsx` | +dropdown Kategori Aset (create+edit) |
| `accounts/actions.ts` | terima `asset_category` di create/update |
| `transactions/_components/TransactionForm.tsx` | pisah Ke Akun + Untuk Goal; rewrite submit routing |
| `transactions/actions.ts` | routing pakai to_account_id langsung |
| `goals/actions.ts` `getGoalsForTransferAction` | drop linked_account dependency |
| `goals/_components/GoalBottomSheet.tsx` | hapus field linked_account |
| `db/schema.ts` + migration | drop `savings_goals.linked_account_id` |
| `db/queries/goals.ts` | hapus select linked_account |
| Net Worth page | render kartu non-liquid per-akun |

## Out of Scope (issue terpisah)

- **bf-btz** goal usage ledger (spend-down goal + history + sub-kategori, anti double-count budget)
- **bf-4z1** income budget
- **bf-aq8** breakdown produk investasi (Saham BCA/Telkom, Emas cincin/digital, dll)
- **bf-yz4** budget untuk transfer/saving

## Debt

Form akun & transfer wording masih Indonesian — AGENTS.md English-first. Translate saat i18n pass global, bukan per-fitur.
