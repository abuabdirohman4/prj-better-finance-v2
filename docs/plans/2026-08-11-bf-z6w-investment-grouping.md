# bf-z6w — Investment Grouping 2-Level: Reksadana/Saham/USD

**Date:** 2026-08-11  
**Issue:** bf-z6w  
**Status:** Plan  
**Migration:** ✅ MCP (Claude eksekusi — `investment_group` di `accounts`)

---

## Context

Akun investment banyak & nama titik-dua (`RDPU:Manulife`, `RDS:Simas`, `USD:NVIDIA`) → dropdown/list panjang. UX 2-level:
- Level 1: pilih grup (`Reksadana`, `Saham`, `USD`, `Emas`, `BPJS`)
- Level 2: pilih produk detail di dalam grup

Berlaku di: picker transaksi + tampilan Net Worth (grup collapse). Muncul dari import bf-bwh (12+ akun investment). Terkait bf-3ai (tracker).

**Data pattern:** nama akun sudah berformat `PREFIX:Produk` (`RDPU:Manulife`, `RDS:Simas`, `USD:NVIDIA`, `Emas:...`, `BPJS:JHT`). Prefix = grup indicator.

---

## Design Decision: Kolom vs Derive

**Opsi A — derive dari nama** (`name.split(":")[0]`): zero migration, tapi rapuh (nama bebas diedit, tak semua akun punya `:`).

**Opsi B — kolom eksplisit `investment_group`** (text, nullable): robust, sesuai prinsip CLAUDE.md "derive dari kolom eksplisit bukan proxy".

**Pilih B.** Tambah `accounts.investment_group` text nullable. Backfill dari prefix nama saat migration. Group mapping:

| Prefix nama | investment_group |
|---|---|
| `RDPU`, `RDPT`, `RDS`, `RDO`, `RD*` | Reksadana |
| `USD`, `US:` | USD |
| `Saham`, `IDX*` | Saham |
| `Emas` | Emas |
| `BPJS`, `JHT`, `JP` | BPJS |
| (lain) | Other |

> ponytail: kolom eksplisit menang atas derive-from-name karena nama editable. Backfill sekali via SQL.

---

## Tasks

### Task 1 — DB Migration ✅ SELESAI (Claude via MCP 2026-08-11) — schema.ts sudah ter-update

### Task 1 — DB Migration ⚡ CLAUDE VIA MCP

```sql
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS investment_group text;
```

Update `src/db/schema.ts` — `accounts`, setelah `asset_category`:
```ts
investment_group: text("investment_group"),
```

⚡ Dieksekusi Claude saat planning. Antigravity mulai dari Task 3.

### Task 2 — Backfill investment_group ⚡ CLAUDE VIA MCP

Cek nama akun investment dulu:
```sql
SELECT id, name FROM accounts WHERE asset_category = 'investment' AND user_id = '<user_id>';
```

Lalu backfill berdasarkan prefix (sesuaikan dengan data aktual):
```sql
UPDATE accounts SET investment_group = CASE
  WHEN name ILIKE 'RDPU%' OR name ILIKE 'RDPT%' OR name ILIKE 'RDS%' OR name ILIKE 'RDO%' OR name ILIKE 'RD %' THEN 'Reksadana'
  WHEN name ILIKE 'USD%' OR name ILIKE 'US:%' THEN 'USD'
  WHEN name ILIKE 'Saham%' OR name ILIKE 'IDX%' THEN 'Saham'
  WHEN name ILIKE 'Emas%' THEN 'Emas'
  WHEN name ILIKE 'BPJS%' OR name ILIKE 'JHT%' OR name ILIKE 'JP%' THEN 'BPJS'
  ELSE 'Other'
END
WHERE asset_category = 'investment' AND user_id = '<user_id>';
```
> ⚠️ Claude: jalankan SELECT dulu, tunjukkan ke user, konfirmasi mapping, baru UPDATE.

### Task 3 — Query: include investment_group

**File:** `src/db/queries/accounts.ts` + `src/db/queries/assets.ts`

Tambah `investment_group` ke `AccountRow` + `AssetRow`, dan select di query masing-masing:
```ts
// AccountRow / AssetRow interface:
investment_group: string | null;
// select:
investment_group: accounts.investment_group,
// mapAccountRow:
investment_group: r.investment_group,
```

Schema `account.ts` — tambah field (untuk create/edit akun investment):
```ts
investment_group: z.string().max(40).optional().nullable(),
```
Dan `createAccount`/`updateAccount` di queries handle field ini.

### Task 4 — Net Worth: grup collapse untuk investment

**File:** `src/app/(app)/assets/page.tsx`

Non-liquid asset cards saat ini flat grid. Group by `investment_group`:
```tsx
// group non-liquid assets by investment_group
const nonLiquid = data?.assets.filter(a => a.asset_category !== "liquid") ?? [];
const grouped = nonLiquid.reduce<Record<string, AssetRow[]>>((acc, a) => {
  const g = a.investment_group || "Other";
  (acc[g] ??= []).push(a);
  return acc;
}, {});
```

Render tiap grup sebagai accordion (collapse) — header grup + total, expand → cards produk:
```tsx
{Object.entries(grouped).map(([group, items]) => (
  <InvestmentGroupCard key={group} group={group} items={items} hideBalances={hideBalances} />
))}
```

`InvestmentGroupCard` (baru, `src/app/(app)/assets/_components/InvestmentGroupCard.tsx`): accordion header (nama grup + total saldo grup + chevron), body = grid AssetCard produk. Pattern mirip `GoalCategoryCard`.

### Task 5 — Picker transaksi: 2-level (grup → produk)

**File:** `src/app/(app)/transactions/_components/TransactionForm.tsx`

Akun investment di picker transfer/spending: kalau langsung flat panjang. `SingleSelect` sudah support `group` (optgroup) — pakai `investment_group` sebagai group label untuk akun investment.

`accountOptions` map — tambah group untuk investment accounts:
```tsx
const accountOptions = accounts.map((a) => ({
  value: a.id,
  label: a.name,
  group: a.asset_category === "investment" ? (a.investment_group ?? "Investment") : undefined,
}));
```
> `SingleSelect` (dari MultiSelect.tsx) sudah render optgroup dari `group` field (lihat AGENTS.md — "optgroup"). Ini memberi 2-level tanpa custom UI: grup jadi header di dropdown, produk di bawahnya. Cek `MultiSelect.tsx` support `group` field.

---

## Files Changed

| File | Perubahan |
|---|---|
| `src/db/schema.ts` | `investment_group` di accounts (migration) |
| `src/db/queries/accounts.ts` | AccountRow + select + create/update |
| `src/db/queries/assets.ts` | AssetRow + select |
| `src/lib/schemas/account.ts` | `investment_group` field |
| `src/app/(app)/assets/page.tsx` | Group non-liquid by investment_group |
| `src/app/(app)/assets/_components/InvestmentGroupCard.tsx` | Accordion component baru |
| `src/app/(app)/transactions/_components/TransactionForm.tsx` | optgroup di picker |

Threshold: 7 files + migration → **Mode A (Antigravity)**

---

## Dependency
- Prasyarat untuk bf-3ai (Investment Tracker) — grouping dipakai tracker view. Kerjakan bf-z6w DULU.

---

## CLAUDE.md Check
- [ ] Pattern baru: `accounts.investment_group` kolom eksplisit (bukan derive dari nama)
- [ ] Kolom baru — dokumentasikan
- [ ] Component baru InvestmentGroupCard
- [ ] Update AGENTS.md: investment grouping 2-level
