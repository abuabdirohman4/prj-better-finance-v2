# Plan: Assets Net Worth View (bf-9v5)

**Date:** 2026-07-23
**Issue:** bf-9v5 · P2 Feature
**Route:** `/assets`
**Scope:** Net worth view — DERIVED dari accounts, dikelompok liquid/non-liquid. READ-ONLY.

---

## Context

Assets di v1 = agregat saldo akun per tipe (liquid/non-liquid). Baca `docs/konsep-keuangan.md` §5. Di v2 SEMUA data sudah ada — tidak perlu tabel/migration baru.

**Kolom `accounts` yang dipakai (SUDAH ADA):**
- `current_balance` (numeric) — saldo live dari transaksi
- `asset_category` (text: `liquid` | `non-liquid`)
- `include_in_net_worth` (boolean) — filter akun yang dihitung ke net worth
- `name`, `icon_name`, `color_hex`, `is_active`

Referensi UI v1: `components/Card/Asset.js` di prj-better-finance (net worth toggle, group liquid/non-liquid).

**FITUR READ-ONLY** — tidak ada CRUD, tidak ada bottom sheet.

---

## Task 1 — Query `getAssets` (`src/db/queries/assets.ts` NEW)

```ts
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";

export interface AssetRow {
  id: string;
  name: string;
  current_balance: number;
  asset_category: string; // "liquid" | "non-liquid"
  icon_name: string | null;
  color_hex: string | null;
}

export interface AssetsSummary {
  assets: AssetRow[];
  totalLiquid: number;
  totalNonLiquid: number;
  netWorth: number;
}

export async function getAssets(userId: string): Promise<AssetsSummary> {
  const rows = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      current_balance: sql<number>`${accounts.current_balance}::numeric`,
      asset_category: accounts.asset_category,
      icon_name: accounts.icon_name,
      color_hex: accounts.color_hex,
    })
    .from(accounts)
    .where(and(
      eq(accounts.user_id, userId),
      eq(accounts.is_active, true),
      eq(accounts.include_in_net_worth, true),
    ))
    .orderBy(accounts.asset_category, accounts.sort_order);

  const totalLiquid = rows.filter(r => r.asset_category === "liquid").reduce((s, r) => s + r.current_balance, 0);
  const totalNonLiquid = rows.filter(r => r.asset_category === "non-liquid").reduce((s, r) => s + r.current_balance, 0);

  return { assets: rows, totalLiquid, totalNonLiquid, netWorth: totalLiquid + totalNonLiquid };
}
```

---

## Task 2 — Server action (`src/app/(app)/assets/actions.ts` NEW)

```ts
"use server";
import { requireUser } from "@/lib/accessControlServer";
import { handleApiError, type ServerActionResult } from "@/lib/errorUtils";
import { getAssets, type AssetsSummary } from "@/db/queries/assets";

export async function getAssetsAction(): Promise<ServerActionResult<AssetsSummary>> {
  try {
    const user = await requireUser();
    const data = await getAssets(user.id);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}
```

---

## Task 3 — Query keys + hook

File: `src/lib/query.ts` — tambah `assetKeys` jika belum ada:
```ts
export const assetKeys = {
  all: ["assets"] as const,
  summary: () => [...assetKeys.all, "summary"] as const,
};
```

File: `src/app/(app)/assets/_hooks/useAssets.ts` (NEW) — pattern standar:
```ts
export function useAssets() {
  return useQuery({
    queryKey: assetKeys.summary(),
    queryFn: async () => {
      const res = await getAssetsAction();
      if (!res.success) throw new Error(res.message);
      return res.data!;
    },
  });
}
```

---

## Task 4 — Page (`src/app/(app)/assets/page.tsx` REPLACE stub)

Pattern: `"use client"` + header gradient/wave (copy dari `src/app/(app)/page.tsx`), body `mt-6`.

Struktur:
1. **Net Worth card** (atas) — total netWorth besar. Cek `hideBalances` dari `usePrivacyStore` → mask `Rp •••`.
2. **Toggle liquid/non-liquid breakdown** — 2 sub-total (Liquid, Non-Liquid) dengan bar proporsi.
3. **Group Liquid** — list AssetRow (nama + saldo). Pakai `formatCurrency`.
4. **Group Non-Liquid** — sama.
5. Loading skeleton + empty state.

Komponen kartu: bisa inline atau `_components/AssetCard.tsx` (opsional). Icon: pakai `getAccountVisual(name)` dari `src/lib/accountVisuals.ts` kalau cocok, atau `asset_category` warna (liquid=biru, non-liquid=hijau seperti v1).

Semua angka WAJIB cek `hideBalances`.

---

## Verifikasi

1. `pnpm tsc --noEmit` → 0 errors.
2. `/assets`: net worth = SUM semua akun include_in_net_worth. Cocokkan manual dgn Summary.
3. Group liquid vs non-liquid benar (akun Emas/BPJS = non-liquid, Wallet/Bank = liquid).
4. Privacy toggle → semua angka jadi mask.
5. Akun `include_in_net_worth = false` TIDAK muncul.

---

## CLAUDE.md Check
- [ ] Route baru `/assets` — tambah ke struktur route docs jika ada daftarnya.
- [ ] Tidak ada pattern baru (murni query+page pattern existing).
