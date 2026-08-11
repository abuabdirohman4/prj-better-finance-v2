# bf-3e0 — AR/AP Liability Proper

**Date:** 2026-08-11  
**Issue:** bf-3e0  
**Status:** Plan

---

## Context

AR/AP akun saat ini diperlakukan sama seperti akun liquid biasa (`asset_category: "liquid"`).
Masalah:
- AP (utang) = **liability** → harus **kurangi** net worth, bukan tambah
- AR (piutang) = asset normal, tapi bukan uang liquid siap pakai
- Keduanya saat ini muncul di `/accounts` (liquid list) — seharusnya punya section tersendiri

Dari beads bf-3e0: AR=asset, AP=liability. Net Worth = Aset − AP.

Kunci konsep: transaksi AR/AP tetap transfer biasa (kas ↔ akun AR/AP). Yang berubah hanya **bagaimana Net Worth menghitung AP**.

---

## Scope

Minimal viable changes — **no schema migration** jika bisa dihindari:

1. Tambah kolom `is_liability: boolean` ke tabel `accounts` (Supabase migration)
2. `getAssets` query: kurangi saldo akun `is_liability=true` dari netWorth (bukan tambah)
3. `getDashboardData`/`totalAssets`: sama, kurangi liability
4. `/accounts` page: filter out `is_liability=true` (AR/AP keluar dari list liquid)
5. `/assets` (Net Worth) page: AR/AP tampil sebagai section terpisah "Liabilities", saldo merah
6. `AccountBottomSheet` create/edit: tambah toggle `is_liability` (hanya tampil jika `asset_category === "liquid"`)

---

## Tasks

### Task 1 — DB Migration: tambah kolom `is_liability`

**File:** Supabase migration (via MCP `apply_migration`)

```sql
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_liability boolean NOT NULL DEFAULT false;
```

**Lalu update schema.ts** — tambah field ke `accounts` table:
```ts
// src/db/schema.ts, di dalam accounts pgTable setelah is_wallet:
is_liability: boolean("is_liability").notNull().default(false),
```

**Verifikasi:** `SELECT column_name FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'is_liability';` → harus return 1 row.

### Task 2 — Mark existing AR/AP accounts sebagai `is_liability`

AR accounts (piutang) = tetap asset, BUKAN liability.  
AP accounts (utang) = liability → `is_liability = true`.

Data migration SQL (jalankan di Supabase):
```sql
-- Update semua akun yang namanya mengandung "AP" atau "Hutang" sebagai liability
-- USER harus konfirmasi nama akun AP yang ada di DB mereka
-- Contoh pattern — sesuaikan dengan data aktual:
UPDATE accounts SET is_liability = true 
WHERE user_id = '<user_id>' 
  AND (name ILIKE '%AP%' OR name ILIKE '%Hutang%' OR name ILIKE '%Payable%');
```

> **Note ke executor:** Tanya user nama pasti akun AP mereka sebelum jalankan ini. Jangan assume.

### Task 3 — Update `AccountRow` type + query

**File:** `src/db/queries/accounts.ts`

Tambah `is_liability` ke `AccountRow` interface (setelah `is_wallet`):
```ts
is_liability: boolean;
```

Tambah field ke `.select()` di `getAccountsWithType` dan `getAccountById`:
```ts
is_liability: accounts.is_liability,
```

Tambah ke `mapAccountRow` function:
```ts
is_liability: r.is_liability,
```

### Task 4 — Update `getAssets` — Net Worth kurangi liability

**File:** `src/db/queries/assets.ts`

Update `AssetsSummary`:
```ts
export interface AssetsSummary {
  assets: AssetRow[];
  liabilities: AssetRow[];  // tambah
  totalLiquid: number;
  totalNonLiquid: number;
  totalLiabilities: number; // tambah
  netWorth: number;
}
```

Update `AssetRow` — tambah `is_liability`:
```ts
export interface AssetRow {
  id: string;
  name: string;
  current_balance: number;
  asset_category: string;
  is_liability: boolean;  // tambah
  icon_name: string | null;
  color_hex: string | null;
}
```

Update query — tambah `is_liability` ke select:
```ts
is_liability: accounts.is_liability,
```

Update kalkulasi netWorth:
```ts
// SEBELUM:
const totalLiquid = rows.filter(r => r.asset_category === "liquid").reduce(...)
const totalNonLiquid = rows.filter(r => r.asset_category !== "liquid").reduce(...)
return { ..., netWorth: totalLiquid + totalNonLiquid }

// SESUDAH:
const nonLiabilityRows = rows.filter(r => !r.is_liability);
const liabilityRows = rows.filter(r => r.is_liability);

const totalLiquid = nonLiabilityRows.filter(r => r.asset_category === "liquid")
  .reduce((s, r) => s + Number(r.current_balance), 0);
const totalNonLiquid = nonLiabilityRows.filter(r => r.asset_category !== "liquid")
  .reduce((s, r) => s + Number(r.current_balance), 0);
const totalLiabilities = liabilityRows.reduce((s, r) => s + Number(r.current_balance), 0);

return {
  assets: nonLiabilityRows.map(r => ({ ...r, current_balance: Number(r.current_balance) })),
  liabilities: liabilityRows.map(r => ({ ...r, current_balance: Number(r.current_balance) })),
  totalLiquid,
  totalNonLiquid,
  totalLiabilities,
  netWorth: totalLiquid + totalNonLiquid - totalLiabilities,
};
```

### Task 5 — Update `getDashboardData` — totalAssets kurangi liability

**File:** `src/db/queries/accounts.ts`

```ts
// SEBELUM:
const totalAssets = accountRows.filter(a => a.include_in_net_worth)
  .reduce((sum, a) => sum + a.current_balance, 0);

// SESUDAH:
const totalAssets = accountRows
  .filter(a => a.include_in_net_worth)
  .reduce((sum, a) => sum + (a.is_liability ? -a.current_balance : a.current_balance), 0);
```

### Task 6 — Update `/accounts` page — filter out liabilities

**File:** `src/app/(app)/accounts/page.tsx`

```ts
// SEBELUM:
const liquidAccounts = accounts?.filter((a) => a.asset_category === "liquid") ?? [];

// SESUDAH:
const liquidAccounts = accounts?.filter((a) => a.asset_category === "liquid" && !a.is_liability) ?? [];
```

### Task 7 — Update `/assets` (Net Worth) page — section Liabilities

**File:** `src/app/(app)/assets/page.tsx`

Update destructure dari `useAssets` hook:
```ts
const { liabilities = [], totalLiabilities = 0 } = data ?? {};
```

Tambah section "Liabilities" setelah grid asset cards (merah, kurangi net worth):
```tsx
{/* Liabilities section — hanya tampil jika ada */}
{(liabilities?.length ?? 0) > 0 && (
  <div>
    <h3 className="text-sm font-semibold text-gray-500 mb-2">Liabilities</h3>
    <div className="grid grid-cols-3 gap-3">
      {liabilities.map(a => (
        <LiabilityCard key={a.id} asset={a} hideBalances={hideBalances} />
      ))}
    </div>
    <div className="mt-2 text-right text-sm text-red-600 font-semibold">
      -{hideBalances ? MASK : formatCurrency(totalLiabilities)}
    </div>
  </div>
)}
```

Buat `LiabilityCard` component (mirip `AssetCard` tapi merah):
```tsx
function LiabilityCard({ asset, hideBalances }: { asset: AssetRow; hideBalances: boolean }) {
  const visual = getAccountVisual(asset.name);
  const initials = visual.initials || asset.name.substring(0, 2).toUpperCase();
  return (
    <div className="bg-white rounded-2xl shadow-md border border-red-100 overflow-hidden flex flex-col">
      <div className="flex flex-col items-center p-3 pb-3">
        <div className="mb-1.5 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white">
          {initials}
        </div>
        <h3 className="font-bold text-gray-900 text-xs text-center truncate w-full">{asset.name}</h3>
      </div>
      <div className="text-center py-1.5 px-1 mt-auto bg-red-100/50 text-red-600">
        <p className="font-bold text-[9px] truncate">
          -{hideBalances ? MASK : formatCurrency(asset.current_balance)}
        </p>
      </div>
    </div>
  );
}
```

Update `useAssets` hook untuk pass `liabilities` & `totalLiabilities`:
**File:** `src/app/(app)/assets/_hooks/useAssets.ts` — tidak perlu perubahan (hook hanya pass-through data dari action).

### Task 8 — Update `AccountBottomSheet` — tambah `is_liability` toggle

**File:** `src/app/(app)/accounts/_components/AccountBottomSheet.tsx`

Tambah `is_liability` ke form state (default false).  
Tambah toggle UI — hanya tampil jika `asset_category === "liquid"`:
```tsx
{assetCategory === "liquid" && (
  <div className="flex items-center justify-between py-2">
    <div>
      <label className="text-sm font-medium text-gray-700">Liability (debt)</label>
      <p className="text-xs text-gray-400">AP / hutang yang mengurangi net worth</p>
    </div>
    <button
      type="button"
      onClick={() => setIsLiability(!isLiability)}
      className={cn(
        "w-12 h-6 rounded-full transition-colors",
        isLiability ? "bg-red-500" : "bg-gray-200"
      )}
    >
      <div className={cn("w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5",
        isLiability ? "translate-x-6" : "translate-x-0")} />
    </button>
  </div>
)}
```

Update `createAccountAction` / `updateAccountAction` untuk pass `is_liability`.

**File:** `src/lib/schemas/account.ts` — tambah field:
```ts
is_liability: z.boolean().default(false),
```

**File:** `src/db/queries/accounts.ts` — `createAccount` + `updateAccount`:
```ts
// createAccount: tambah is_liability ke .values()
is_liability: input.is_liability ?? false,

// updateAccount: tambah ke values object
if (input.is_liability !== undefined) values.is_liability = input.is_liability;
```

---

## Files Changed

| File | Perubahan |
|---|---|
| `src/db/schema.ts` | Tambah `is_liability` ke `accounts` table |
| `src/db/queries/accounts.ts` | `AccountRow` + `getAccountsWithType` + `getAccountById` + `mapAccountRow` + `getDashboardData` + `createAccount` + `updateAccount` |
| `src/db/queries/assets.ts` | `AssetRow` + `AssetsSummary` + `getAssets` kalkulasi |
| `src/app/(app)/accounts/page.tsx` | Filter `!is_liability` dari liquid list |
| `src/app/(app)/accounts/_components/AccountBottomSheet.tsx` | Toggle `is_liability` |
| `src/app/(app)/assets/page.tsx` | Section Liabilities + `LiabilityCard` |
| `src/lib/schemas/account.ts` | Tambah `is_liability` |
| Supabase migration | `ALTER TABLE accounts ADD COLUMN is_liability` |

Threshold: 8 files → **Mode A (Antigravity)**

---

## CLAUDE.md Check
- [ ] Apakah ada pattern/arsitektur BARU yang diperkenalkan di task ini? — Ya: `is_liability` flag pattern untuk accounts
- [ ] Apakah ada tabel database baru? — Tidak, hanya kolom baru
- [ ] Apakah ada route/page baru? — Tidak
- [ ] Update `AGENTS.md` setelah implementasi: dokumentasikan bahwa AR/AP account = `is_liability=true`, filtered dari `/accounts`, tampil di `/assets` section Liabilities
