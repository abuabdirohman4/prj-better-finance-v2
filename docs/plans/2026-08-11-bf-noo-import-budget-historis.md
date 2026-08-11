# bf-noo — Import Budget Historis dari Sheet

**Date:** 2026-08-11  
**Issue:** bf-noo  
**Status:** Plan  
**Migration:** ❌ None (script import ke tabel `budgets` existing)

---

## Context

Import budget target per kategori per bulan dari sheet v1 (tab `Spending`/`Earning`/`Transfer`/`SpendingTF`).

**Format sheet:** matrix per bulan, mundur Aug→Jan:
```
CATEGORY | BUDGET AUG | BALANCE AUG | ACTUAL AUG | BUDGET JUL | BALANCE JUL | ACTUAL JUL | ...
```
Ambil kolom `BUDGET <month>` per kategori → map ke tabel `budgets` (budget_year, budget_month, category_id, budgeted_amount).

Kategori sudah ada (hasil bf-bwh). Prasyarat: bf-bwh selesai ✅.

**Existing infra:** `scripts/migrate-sheet.ts` (1103 lines) sudah punya: CSV parser, gviz fetch (`fetchTab`), header normalize, category matching, slug, dedup hash, DB insert via drizzle. Reuse infrastruktur ini.

---

## Design

Script terpisah `scripts/import-budget.ts` (atau flag di migrate-sheet). Pilih: **script terpisah** — beda concern (budget matrix vs transaksi ledger), lebih bersih.

Alur:
1. Fetch tab `Spending`, `Earning`, `Transfer`, `SpendingTF` via gviz
2. Parse header → temukan kolom `BUDGET <MONTH>` (regex `/^BUDGET\s+(\w+)/i`)
3. Per baris kategori: untuk tiap kolom BUDGET, ambil nilai → `{ category, month, amount }`
4. Match category name → `categories.id` (reuse logic dari migrate-sheet: lowercase + blacklist)
5. Upsert ke `budgets` (unique `user_id, budget_year, budget_month, category_id`)
6. Idempotent: upsert on conflict (bukan hash — budget bisa re-import & overwrite)

---

## Tasks

### Task 1 — Script scaffold

**File:** `scripts/import-budget.ts` (baru)

```ts
/**
 * Import budget target per kategori per bulan dari sheet v1.
 * Usage: pnpm tsx scripts/import-budget.ts <year> [--dry]
 * Tabs: Spending, Earning, Transfer, SpendingTF
 * Format: CATEGORY | BUDGET <MONTH> | BALANCE <MONTH> | ACTUAL <MONTH> | ...
 */
import { db } from "@/db";
import { categories, budgets } from "@/db/schema";
import { and, eq } from "drizzle-orm";

const SHEET_ID = process.env.SHEET_ID_BUDGET ?? "1mVgdePlteuewjY6DvdUmNyHf0CPoAoHY3Sh3lDymV5A";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const BUDGET_TABS = ["Spending", "Earning", "Transfer", "SpendingTF"];
```

Copy `parseCSV`, `fetchTab`, `parseNum`, `normalizeHeader` dari `migrate-sheet.ts` (atau extract ke `scripts/_sheet-utils.ts` shared — lebih DRY, tapi bikin migrate-sheet ikut import; simplest: copy fungsi yang dipakai).

> ponytail: copy 4 helper functions, jangan refactor migrate-sheet ke shared module dulu (risiko regresi import 2026 yang sudah jalan). Extract nanti kalau ada tab ketiga yang butuh.

### Task 2 — Parse BUDGET columns

```ts
function findBudgetColumns(header: string[]): { month: number; colIndex: number }[] {
  const result: { month: number; colIndex: number }[] = [];
  header.forEach((h, i) => {
    const m = h.match(/^BUDGET\s+(\w{3})/i);
    if (m) {
      const monthIdx = MONTHS.findIndex(mo => mo.toLowerCase() === m[1].toLowerCase());
      if (monthIdx >= 0) result.push({ month: monthIdx + 1, colIndex: i });
    }
  });
  return result;
}
```

### Task 3 — Category matching (reuse migrate-sheet logic)

Load categories dari DB, buat map `name.toLowerCase() → id`. Skip kategori yang tidak match (log warning). Reuse `CATEGORY_BLACKLIST` konsep dari migrate-sheet kalau perlu.

```ts
const cats = await db.select({ id: categories.id, name: categories.name })
  .from(categories).where(eq(categories.user_id, USER_ID));
const catMap = new Map(cats.map(c => [c.name.toLowerCase().trim(), c.id]));
```

### Task 4 — Upsert budgets

```ts
for (const { category, month, amount } of budgetRows) {
  if (amount <= 0) continue;
  const catId = catMap.get(category.toLowerCase().trim());
  if (!catId) { console.warn(`skip: no category "${category}"`); continue; }
  if (dry) { console.log(`[dry] ${year}-${month} ${category}: ${amount}`); continue; }
  await db.insert(budgets).values({
    user_id: USER_ID, budget_year: year, budget_month: month,
    category_id: catId, budgeted_amount: String(amount),
  }).onConflictDoUpdate({
    target: [budgets.user_id, budgets.budget_year, budgets.budget_month, budgets.category_id],
    set: { budgeted_amount: String(amount), updated_at: new Date() },
  });
}
```

### Task 5 — Dry run + verify

Jalankan `pnpm tsx scripts/import-budget.ts 2026 --dry` → cek output masuk akal (jumlah baris, kategori matched vs skipped). Lalu tanpa `--dry` untuk commit. Verify:
```sql
SELECT budget_month, COUNT(*), SUM(budgeted_amount) FROM budgets 
WHERE user_id = '<user_id>' AND budget_year = 2026 GROUP BY budget_month ORDER BY budget_month;
```

> Claude JANGAN jalankan script sendiri (boros token + butuh env). User yang run, Claude analisa output.

---

## Files Changed

| File | Perubahan |
|---|---|
| `scripts/import-budget.ts` | Script baru (reuse helper migrate-sheet) |

Threshold: 1 file (tapi ~200 lines script) → **Mode A (Antigravity)** atau **B** (script terisolasi, bisa Claude langsung kalau user mau). Rekomendasi A.

---

## CLAUDE.md Check
- [ ] Tidak ada schema baru — pakai tabel budgets existing
- [ ] Script pattern reuse dari migrate-sheet.ts
- [ ] Tidak update AGENTS.md kecuali ada gotcha baru saat eksekusi
