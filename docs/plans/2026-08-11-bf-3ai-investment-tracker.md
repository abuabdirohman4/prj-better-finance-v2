# bf-3ai — Investment Tracker: Current Value + P&L

**Date:** 2026-08-11  
**Issue:** bf-3ai  
**Status:** Plan  
**Migration:** ✅ MCP (Claude eksekusi — kolom `current_value` + `last_valued_at` di `accounts`)

---

## Context

Investment Tracker seperti sheet v1. Schema v2 `accounts` sekarang cuma `current_balance` (1 angka = modal/cost basis dari transaksi). Belum muat:
1. Market/current value terpisah dari modal
2. Profit/loss
3. asset_type grouping (RDPU/RDS/Emas/USD/dst) — **sudah dihandle bf-z6w** (`investment_group`)
4. Goals allocation per holding
5. Emas detail (berat/karat/harga beli/tanggal/status)

Data modal + transaksi sudah masuk via import bf-bwh. Fitur ini nambah layer **current value + P/L + view tracker**.

---

## Design Decision: Kolom vs Tabel Baru

**Yang dibutuhkan minimal untuk P&L:** modal (sudah = `current_balance`) + current market value (baru).

**Opsi A — 2 kolom di accounts** (`current_value`, `last_valued_at`): 
- `current_balance` = modal (cost basis, dari transaksi)
- `current_value` = nilai pasar sekarang (manual input user, atau nanti API)
- P&L = `current_value - current_balance`
- Zero tabel baru. Cukup untuk 90% use case (P&L per akun).

**Opsi B — tabel `investment_holdings`** (berat emas, karat, unit, harga beli per lot, dll): jauh lebih kompleks, multi-lot per akun, emas detail.

**Pilih A untuk MVP tracker.** Emas detail (berat/karat) = defer ke bf-3ai-v2 atau issue terpisah kalau user benar butuh. Reasoning: satu akun investment = satu holding view (modal vs pasar) menutup kebutuhan utama "berapa untung/rugi". Multi-lot + emas karat = over-engineering sampai user minta.

> ⚡ ponytail: 2 kolom current_value/last_valued_at, bukan tabel holdings. Emas berat/karat defer sampai diminta — YAGNI.

---

## Tasks

### Task 1 — DB Migration ✅ SELESAI (Claude via MCP 2026-08-11) — schema.ts sudah ter-update

### Task 1 — DB Migration ⚡ CLAUDE VIA MCP

```sql
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS current_value numeric(18,2);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS last_valued_at timestamptz;
```

Update `src/db/schema.ts` — `accounts`:
```ts
current_value: numeric("current_value", { precision: 18, scale: 2 }),
last_valued_at: timestamp("last_valued_at", { withTimezone: true }),
```

⚡ Dieksekusi Claude saat planning. Antigravity mulai dari Task 2.

### Task 2 — Query: current_value + P&L derive

**File:** `src/db/queries/assets.ts`

Tambah ke `AssetRow`:
```ts
current_value: number | null;   // nilai pasar; null = belum diinput → pakai current_balance
pnl: number;                    // current_value - current_balance (0 kalau current_value null)
```

Update `getAssets` select + mapping:
```ts
current_value: sql<number>`${accounts.current_value}::numeric`,
// dalam map:
const cv = r.current_value == null ? null : Number(r.current_value);
const modal = Number(r.current_balance);
return { ...r, current_value: cv, pnl: cv == null ? 0 : cv - modal };
```

**PENTING — Net Worth pakai current_value kalau ada:** non-liquid total pakai `current_value ?? current_balance`:
```ts
const totalNonLiquid = nonLiabilityRows
  .filter(r => r.asset_category !== "liquid")
  .reduce((s, r) => {
    const cv = r.current_value == null ? Number(r.current_balance) : Number(r.current_value);
    return s + cv;
  }, 0);
```
> Net Worth jadi mencerminkan nilai pasar, bukan modal. Ini benar — net worth = nilai aset sekarang.

### Task 3 — Schema + action update current_value

**File:** `src/lib/schemas/account.ts`
```ts
current_value: z.number().optional().nullable(),
```

**File:** `src/db/queries/accounts.ts` — `updateAccount`:
```ts
if (input.current_value !== undefined) {
  values.current_value = input.current_value == null ? null : String(input.current_value);
  values.last_valued_at = new Date();
}
```

### Task 4 — UI: input current_value (per akun investment)

**File:** `src/app/(app)/accounts/[id]/page.tsx` + component

Untuk akun investment, di halaman detail `/accounts/[id]` tambah card "Market Value":
- Tampil modal (`current_balance`), current value (`current_value`), P&L (selisih + %)
- Input untuk update current value (mirip reality check form)

Component baru `src/app/(app)/accounts/[id]/_components/MarketValueCard.tsx`:
```tsx
"use client";
import { useState } from "react";
import { formatCurrency } from "@/lib/helper";
// input current_value, panggil updateAccountAction({ current_value })
// tampil: Modal | Nilai Pasar | P&L (hijau kalau +, merah kalau -)
```
Hanya render kalau `account.asset_category === "investment"`.

### Task 5 — Tracker view di /assets (P&L summary)

**File:** `src/app/(app)/assets/page.tsx`

Di `InvestmentGroupCard` (dari bf-z6w) tampilkan P&L per produk + total P&L per grup:
```tsx
// per AssetCard investment: badge P&L
{asset.current_value != null && asset.pnl !== 0 && (
  <span className={asset.pnl > 0 ? "text-green-600" : "text-red-500"}>
    {asset.pnl > 0 ? "+" : ""}{formatCurrency(asset.pnl, "short")}
  </span>
)}
```

Tambah total P&L card di atas grid non-liquid:
```tsx
const totalPnl = nonLiquid.reduce((s, a) => s + a.pnl, 0);
// tampil kalau ada current_value: "Unrealized P&L: +Rp X"
```

---

## Files Changed

| File | Perubahan |
|---|---|
| `src/db/schema.ts` | `current_value` + `last_valued_at` (migration) |
| `src/db/queries/assets.ts` | AssetRow P&L + Net Worth pakai current_value |
| `src/lib/schemas/account.ts` | `current_value` field |
| `src/db/queries/accounts.ts` | updateAccount current_value + last_valued_at |
| `src/app/(app)/accounts/[id]/_components/MarketValueCard.tsx` | Component baru |
| `src/app/(app)/accounts/[id]/page.tsx` | Render MarketValueCard |
| `src/app/(app)/assets/page.tsx` | P&L per produk + total |

Threshold: 7 files + migration → **Mode A (Antigravity)**

---

## Dependency
- **Depends on bf-z6w** (investment_group) — tracker view pakai grup. Kerjakan bf-z6w dulu.

## Deferred (YAGNI — add kalau user minta)
- Tabel `investment_holdings` multi-lot per akun
- Emas detail: berat/karat/harga beli/tanggal/status
- Goals allocation per holding (sebagian ketutup bf-6rl goal.account_id)
- Auto-fetch harga pasar via API

---

## CLAUDE.md Check
- [ ] Pattern baru: `current_value` (nilai pasar) vs `current_balance` (modal). Net Worth non-liquid pakai current_value ?? current_balance.
- [ ] 2 kolom baru — dokumentasikan
- [ ] Component MarketValueCard baru
- [ ] Update AGENTS.md: investment tracker P&L
