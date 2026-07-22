# Plan: Assets Feature (bf-9v5)

**Date:** 2026-07-22
**Issue:** bf-9v5 · P2 Feature
**Route:** `/assets`
**Scope:** Net worth view — akun grouped by asset_category, toggle include/exclude non-liquid

---

## Context

**Tidak ada tabel `assets` terpisah** — assets di v2 = akun dengan `include_in_net_worth = true`, grouped by `asset_category` (field di tabel `accounts`).

`asset_category` values dari v1: `"liquid"`, `"investment"`, `"property"`, `"other"`.

v1 assets read dari Google Sheets. v2: query accounts langsung dari DB, filter `include_in_net_worth`, group by `asset_category`.

`assetKeys` sudah ada di `src/lib/query.ts`: `assetKeys.all / .list() / .netWorth()`

`AccountRow` sudah punya semua field yang dibutuhkan (`asset_category`, `include_in_net_worth`, `current_balance`).
`getAccountsWithType(userId)` di `src/db/queries/accounts.ts` sudah return semua akun — tinggal filter client-side atau tambah query dedicated.

---

## Files

```
src/db/queries/assets.ts                            ← NEW (thin wrapper atas accounts query)
src/app/(app)/assets/actions.ts                     ← NEW
src/app/(app)/assets/_hooks/useAssets.ts            ← NEW
src/app/(app)/assets/_components/AssetGroupCard.tsx ← NEW
src/app/(app)/assets/page.tsx                       ← REPLACE stub
```

Tidak perlu schema zod baru (read-only — tidak ada create/edit/delete asset di halaman ini, itu di `/accounts`).

---

## Task 1 — Query (`src/db/queries/assets.ts`)

Thin wrapper — reuse `getAccountsWithType` + filter:

```ts
import { getAccountsWithType, type AccountRow } from "@/db/queries/accounts";

export interface AssetGroup {
  category: string;
  accounts: AccountRow[];
  total: number;
}

export async function getAssets(userId: string): Promise<{
  groups: AssetGroup[];
  netWorth: number;
  totalLiquid: number;
}> {
  const all = await getAccountsWithType(userId);
  const included = all.filter((a) => a.include_in_net_worth && a.is_active !== false);

  const groupMap = new Map<string, AccountRow[]>();
  for (const acc of included) {
    const cat = acc.asset_category ?? "other";
    if (!groupMap.has(cat)) groupMap.set(cat, []);
    groupMap.get(cat)!.push(acc);
  }

  const ORDER = ["liquid", "investment", "property", "other"];
  const groups: AssetGroup[] = ORDER
    .filter((cat) => groupMap.has(cat))
    .map((cat) => ({
      category: cat,
      accounts: groupMap.get(cat)!,
      total: groupMap.get(cat)!.reduce((s, a) => s + a.current_balance, 0),
    }));

  const netWorth = included.reduce((s, a) => s + a.current_balance, 0);
  const totalLiquid = (groupMap.get("liquid") ?? []).reduce((s, a) => s + a.current_balance, 0);

  return { groups, netWorth, totalLiquid };
}
```

---

## Task 2 — Server Action (`src/app/(app)/assets/actions.ts`)

```ts
"use server";
import { requireUser } from "@/lib/accessControlServer";
import { handleApiError, type ServerActionResult } from "@/lib/errorUtils";
import { getAssets } from "@/db/queries/assets";

export async function getAssetsAction(): Promise<ServerActionResult<Awaited<ReturnType<typeof getAssets>>>> {
  try {
    const user = await requireUser();
    const data = await getAssets(user.id);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat aset").message };
  }
}
```

---

## Task 3 — Hook (`src/app/(app)/assets/_hooks/useAssets.ts`)

```ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { assetKeys } from "@/lib/query";
import { getAssetsAction } from "../actions";

export function useAssets() {
  return useQuery({
    queryKey: assetKeys.netWorth(),
    queryFn: async () => {
      const res = await getAssetsAction();
      if (!res.success) throw new Error(res.message);
      return res.data!;
    },
  });
}
```

---

## Task 4 — AssetGroupCard (`src/app/(app)/assets/_components/AssetGroupCard.tsx`)

```tsx
// Props: category (string), accounts (AccountRow[]), total (number), hideBalances (boolean)
// Display: category label (capitalize), total group, list akun dengan balance
// category label map: liquid→"Likuid", investment→"Investasi", property→"Properti", other→"Lainnya"
```

Tap akun → `Link href="/accounts/{id}"` (navigation ke balancing page).

---

## Task 5 — Page (`src/app/(app)/assets/page.tsx`)

- Header gradient + wave, judul "Aset & Kekayaan"
- Net worth card: total semua `include_in_net_worth` akun, `hideBalances` aware
- Liquid summary (quick reference)
- List `AssetGroupCard` per kategori
- Loading skeleton, empty state
- **Tidak ada FAB** — manage akun via `/accounts`
- Link "Kelola Akun →" di empty state / footer menuju `/accounts`

---

## Verifikasi

1. `/assets` render, net worth card muncul dengan total benar
2. Akun grouped: liquid → investment → property → other
3. `hideBalances` → semua angka sensor
4. Tap nama akun → navigate ke `/accounts/{id}`
5. Akun `include_in_net_worth = false` tidak ikut dihitung

## CLAUDE.md Check
- [ ] Pattern read-only (tidak ada mutation) — tidak perlu update AGENTS.md
