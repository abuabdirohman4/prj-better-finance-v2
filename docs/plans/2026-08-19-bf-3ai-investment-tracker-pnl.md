# bf-3ai — Investment Tracker: current_value manual + P&L (REVISI plan 2026-08-11)

**Date:** 2026-08-19 · **Issue:** bf-3ai · **Mode:** B (Claude direct) · **Supersedes:** `2026-08-11-bf-3ai-investment-tracker.md`
**Depends:** bf-z6w ✅ (model sub-produk). Kolom `current_value` + `last_valued_at` sudah ada.

## Keputusan (dikunci)
- **Input manual per sub-produk** di `/assets/[group]` (bukan `/accounts/[id]` seperti plan lama — akun investasi tak tampil di /accounts). User isi kapan mau; kosong = tampil "—", P&L tak dihitung. Tidak ada seeding data (keputusan user 2026-08-19; auto price feed = bf-7h2 nanti).
- **Net Worth tetap modal-based** (`current_balance`, parity spreadsheet). Market value + P&L = info terpisah. Berubah hanya kalau user minta nanti.
- `pnl = current_value − current_balance` (null kalau current_value null). `pnlPercent = pnl / current_balance` (null kalau modal 0).
- Grup: `totalValue = Σ (current_value ?? current_balance)` (produk belum dinilai = dianggap at cost), `pnl = Σ pnl` produk yang dinilai, `valuedCount`.
- Set `current_value = null` = hapus valuation (last_valued_at ikut null).

## Tasks
1. **Query** `src/db/queries/assets.ts`: `AssetRow` + `current_value: number|null`, `last_valued_at: string|null`, `pnl: number|null`. `InvestmentGroupRow` + `totalValue`, `pnl`, `valuedCount`. Select 2 kolom baru.
2. **Query** `src/db/queries/accounts.ts`: `updateAccountValue(userId, accountId, value: number|null)` → set `current_value`, `last_valued_at = value==null ? null : now()`, `updated_at`. Filter user_id.
3. **Action** `src/app/(app)/assets/actions.ts`: `updateAccountValueAction(accountId, value)` — `requireUser`, `getAccountById` (ownership, must be `asset_category === "investment"`), `value == null || (Number.isFinite && >= 0)`, else `{success:false}`. English messages.
4. **Hook** `src/app/(app)/assets/_hooks/useAssets.ts`: tambah `useUpdateAccountValue()` mutation → invalidate `assetKeys.all`.
5. **UI** `/assets/[group]/page.tsx`: header card 3 angka (Invested · Market Value · P&L ±%); tiap baris produk: label, modal, market value (atau "Set value"), P&L chip hijau/merah; tap baris → inline editor (Input Rp format digit-only spt TransactionForm `handleAmountChange`, tombol Save / Clear / Cancel), tampil "Updated <tanggal>" dari `last_valued_at`. Privacy mask semua angka.
6. **UI** `/assets/page.tsx` GroupCard: kalau `valuedCount > 0` tampil P&L kecil di bawah total (`+Rp 1,2 jt` hijau / merah). Tetap total modal sebagai angka utama.
7. Docs: AGENTS.md (section Investment: current_value manual, P&L formula, Net Worth tetap modal), roadmap (A1 done, A2 close aq8), README (skip — bf-xd4).
8. Verify: tsc, `npm run build` (user), Net Worth SQL tetap 50.831.765,27 (tak boleh berubah — tak ada mutasi balance di issue ini).

## Files
`src/db/queries/assets.ts` · `src/db/queries/accounts.ts` · `src/app/(app)/assets/actions.ts` · `_hooks/useAssets.ts` · `[group]/page.tsx` · `page.tsx` · AGENTS.md · docs/roadmap.md

## Deferred
Riwayat valuasi (snapshots), auto price (bf-7h2), Net Worth pakai market value (tanya user setelah data terisi).
