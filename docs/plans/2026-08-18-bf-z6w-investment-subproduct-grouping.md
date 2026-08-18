# bf-z6w — Investment Grouping + Model Sub-Produk (REVISI plan 2026-08-11)

**Date:** 2026-08-18 · **Issue:** bf-z6w · **Status:** Plan (menunggu approval) · **Mode:** B (Claude direct)
**Supersedes:** `docs/plans/2026-08-11-bf-z6w-investment-grouping.md` (usang: belum kenal sub-produk, Net Worth belum grup).
**Fondasi untuk:** bf-3ai (current_value + P&L), bf-z65 (audit reksadana), bf-aq8 (breakdown produk).

---

## 1. Kondisi sekarang (verified 2026-08-18 via SQL)

- Net Worth = **50.831.765,27** = spreadsheet. `investment_group` semua NULL. `current_value` semua NULL.
- Akun investment aktif (user `321d6292-…`): BPJS : JHT / BPJS : JP / Crypto / Emas / Jago / Saham / USD : NVIDIA / 9 reksadana (`RDPU : …`, `RDPT : …`, `RDS : …`). BNI + Rekapan inactive.
- Opening non-liquid: 1 tx/akun tgl 2026-01-01, `source_month='2026-Opening'`, hash `opening-2026-nl-<slug>` (mis. `opening-2026-nl-emas` = 7.520.000, `opening-2026-nl-saham` = 355.900).
- Sub-produk (dari spreadsheet, bd memory `bf-z6w-investment-detail`): Emas 7 sub (Antam 0.5g, Antam 1g, Cincin AY, Digital Tring, Gelang HWT, Anting Per, Anting Toge) · Saham 3 sub (PGAS, GOTO, UB Kendal) · USD 1 (NVIDIA) · Crypto 1 (Bitcoin) · BPJS 2 (JHT, JP) · Reksadana 9.
- Transaksi 2026 yang kena split: **1** — `2026-04-14 Mandiri → Emas 310.000 note "Emas : Digital Tring"`. Saham: 0 tx 2026. (Nama sub-produk sudah ada di note sheet → migrate bisa map langsung.)
- Migrate script `parseInvestmentDest` Tipe C: note `"Emas : X"` → dest `"Emas"` (agregat). Tipe A: `"Goal (RDPU : Trimegah)"` → dest `"RDPU : Trimegah"` (sudah per-produk).

---

## 2. Keputusan desain (DIKUNCI di sini — bf-3ai/z65/aq8 ikut)

### D1. Model sub-produk = **1 akun `accounts` per sub-produk + `investment_group` sebagai grup tampilan**. Tanpa tabel baru.

| Opsi | Nilai |
|---|---|
| **A. Akun per sub-produk + `investment_group`** ✅ | Reuse SEMUA yang sudah ada: transaksi/RPC balance, opening-nl, `current_value`/`last_valued_at` (sudah di `accounts`), `savings_goals.account_id`, picker transaksi, migrate script (sudah bikin akun per produk untuk RD/BPJS/USD). Agregat grup = `SUM` di query. Nol migration. |
| B. Tabel `investment_holdings` child | Butuh: tabel, FK, RPC balance baru, migrate script jalur baru, current_value pindah tabel, goal link baru. Semua duplikasi dari `accounts`. YAGNI. |

Konvensi nama: **`"<Grup> : <Produk>"`** — konsisten dgn existing (`RDPU : Trimegah Kas Syariah`, `BPJS : JHT`, `USD : NVIDIA`). Reksadana tetap prefix RDPU/RDPT/RDS di nama (informasi jenis RD), grup tampilan = `Reksadana`.

`investment_group` (text nullable, sudah ada): nilai = `Reksadana | Emas | Saham | USD | Crypto | BPJS`. Akun investment tanpa grup (mis. **Jago**) → tampil sebagai kartu sendiri (grup efektif = nama akun). Tidak bikin grup "Other"/"Savings" — YAGNI.

**Default cerdas:** saat create akun investment tanpa `investment_group`, server derive prefix sebelum `" : "` (`"Emas : Antam 1g"` → `Emas`). Kolom eksplisit tetap sumber kebenaran (bisa di-override), nama hanya default. Prefix RD* → `Reksadana` (map kecil `RD_PREFIXES`).

### D2. Split akun agregat Emas/Saham TANPA merusak Net Worth

Prinsip: total opening-nl sub-produk = opening agregat lama + mutasi yang dipindah, sehingga `SUM(current_balance)` grup tetap = 7.830.000 (Emas) dan 355.900 (Saham).

Langkah (SQL sekali-jalan via MCP, dibungkus 1 transaction):
1. `INSERT accounts` sub-produk baru (investment, `investment_group`, `sort_order`), **kecuali** 1 sub-produk per grup yang **me-reuse row agregat lama** (rename `Emas` → `Emas : <sub terbesar>`, `Saham` → `Saham : <sub terbesar>`) — biar tidak ada akun zombie inactive + id/slug lama tetap hidup.
2. Tx `Mandiri → Emas 310.000 "Emas : Digital Tring"` → `UPDATE to_account_id` = akun `Emas : Digital Tring`. (Balance dipindah manual: `Emas` −310.000, `Digital Tring` +310.000 — atau langsung set via opening di langkah 3.)
3. Opening per sub-produk: `INSERT transactions` earning tgl 2026-01-01, `source_month='2026-Opening'`, `import_row_hash='opening-2026-nl-<slug-sub>'`, amount = **modal sub-produk (dari sheet) − mutasi 2026 yang sudah nyata di DB** (Digital Tring: modal − 310.000; sisanya = modal). Opening agregat lama (`opening-2026-nl-emas`, `opening-2026-nl-saham`) → **DELETE** (row yang di-reuse dapat opening baru dgn hash sub-nya sendiri).
4. `UPDATE accounts.current_balance` = SUM tx per akun (recompute langsung via SQL, bukan RPC — seeding sekali-jalan; RPC hanya untuk mutasi runtime).
5. Verify: `SUM current_balance` grup Emas = 7.830.000, Saham = 355.900, Net Worth = 50.831.765,27.

**Data yang DIBUTUHKAN dari user** (tidak ada di DB/bd memory, gviz tab tracker tidak ketemu): tabel sub-produk `nama | modal (Investment) | current value | goal` untuk **Emas (7)** dan **Saham (3)**, plus current value semua produk lain (untuk bf-3ai). Modal Emas HARUS jumlah 7.830.000; Saham 355.900 — kalau tidak, user putuskan (spreadsheet yang benar atau DB).

### D3. Backfill `investment_group` akun existing

```sql
UPDATE accounts SET investment_group = CASE
  WHEN name ~* '^RD(PU|PT|S|O)\s*:' THEN 'Reksadana'
  WHEN name ILIKE 'BPJS :%' THEN 'BPJS'
  WHEN name ILIKE 'USD :%'  THEN 'USD'
  WHEN name ILIKE 'Emas%'   THEN 'Emas'
  WHEN name ILIKE 'Saham%'  THEN 'Saham'
  WHEN name = 'Crypto'      THEN 'Crypto'
END
WHERE user_id = '<uid>' AND asset_category = 'investment' AND is_active;
-- Jago, BNI, Rekapan → NULL (sengaja)
```
Crypto: 1 akun `Crypto` (sub-produk Bitcoin) — **rename ke `Crypto : Bitcoin`** biar konsisten? → Ya, sekalian (1 UPDATE, hash opening tetap `opening-2026-nl-crypto`).

### D4. Net Worth `/assets` = kartu **per grup**, tap → halaman detail `/assets/[group]`

- Grid kartu non-liquid: 1 kartu per grup (`Reksadana`, `Emas`, `Saham`, `USD`, `Crypto`, `BPJS`, `Jago`), angka = Σ `current_balance` anggota. Ganti kartu per-akun sekarang (17 kartu → 7). Kartu liquid `Accounts` tetap.
- Tap kartu → **route baru `/assets/[group]`** (pattern sama `/accounts/[id]`: header gradient + back + judul grup + total). Body: list sub-produk (nama produk tanpa prefix grup, modal). bf-3ai nanti nambah kolom market value + P&L + tombol update value di halaman ini — jadi halaman detail dibuat sekarang, kolom P&L menyusul.
- **Tidak ada query/action/hook baru** untuk detail: pakai `useAssets()` yang sama, filter client-side `investment_group === group`. `[group]` di URL = `encodeURIComponent(group)`; akun tanpa grup pakai `id` akun (`/assets/<uuid>` → filter `id === param`). Satu page handle dua kasus.
- Net Worth tetap **modal-based** (`current_balance`) di bf-z6w — parity spreadsheet. Perubahan ke market value diputuskan di bf-3ai (rekomendasi awal: Net Worth tetap modal = spreadsheet; market value + P&L tampil terpisah).

### D5. Picker transaksi: optgroup by `investment_group`
`TransactionForm` + `FilterBar` `accountOptions`: `group: a.asset_category === "investment" ? (a.investment_group ?? "Investment") : undefined`. `SingleSelect`/`MultiSelect` sudah render optgroup. Liquid tanpa group → tampil di atas tanpa header (cek `MultiSelect` `__ungrouped` first).

### D6. Migrate script: dest per sub-produk
`parseInvestmentDest` Tipe C: return `{ account: trimmed, goal: null }` (full `"Emas : Digital Tring"`), bukan `"Emas"`. Auto-create akun baru investment: set `investment_group` = derive prefix (fungsi shared `deriveInvestmentGroup(name)` — taruh di `src/lib/investment.ts`, dipakai script + `createAccount`).

### D7. Form akun (AccountBottomSheet)
Saat `asset_category === "investment"`: tampil `Input` teks "Group (optional)" placeholder `e.g. Reksadana, Emas, Saham` — kosong = auto dari nama. Edit mode isi dari `account.investment_group`.

---

## 3. Tasks

### Task 0 — Data dari user (BLOCKER Task 2)
Minta tabel sub-produk Emas + Saham (modal, current value, goal) + current value produk lain. Simpan ke `docs/plans/2026-08-18-bf-z6w-subproduct-data.md` (referensi audit).

### Task 1 — Lib helper `src/lib/investment.ts` (baru)
```ts
// Grup investasi = kolom eksplisit accounts.investment_group; nama hanya DEFAULT saat kosong.
const RD_PREFIX = /^RD(PU|PT|S|O|C)?\b/i;
export function deriveInvestmentGroup(name: string): string | null {
  const idx = name.indexOf(":");
  if (idx < 0) return null;
  const prefix = name.slice(0, idx).trim();
  return RD_PREFIX.test(prefix) ? "Reksadana" : prefix || null;
}
/** "Emas : Antam 1g" → "Antam 1g" (label produk tanpa prefix grup). */
export function productLabel(name: string): string {
  const idx = name.indexOf(":");
  return idx < 0 ? name : name.slice(idx + 1).trim() || name;
}
```
+ 1 unit test `src/lib/__tests__/investment.test.ts` (vitest, 4 assert).

### Task 2 — Data seeding (SQL MCP, 1 transaction) — SETELAH Task 0 + approval
Sesuai D2 + D3. Verify query wajib di akhir:
```sql
select investment_group, sum(current_balance) from accounts where user_id='<uid>' and is_active and asset_category='investment' group by 1;
select sum(case when is_liability then -current_balance else current_balance end) from accounts where user_id='<uid>' and is_active and include_in_net_worth; -- 50831765.27
```
Cek balance = Σ tx: `select a.name, a.current_balance, coalesce(sum(...),0) ...` per akun investment (kalau beda → stop, jangan tebak).

### Task 3 — Query layer
- `src/db/queries/assets.ts` `AssetRow` + select: `investment_group: string | null`. Tambah `AssetsSummary.investmentGroups: { key: string; label: string; total: number; items: AssetRow[] }[]` (key = group ?? id; label = group ?? name) — dihitung server-side sekali biar page + detail pakai struktur sama.
- `src/db/queries/accounts.ts` `AccountRow` + `getAccountsWithType`/`getAccountById` select + `mapAccountRow`: `investment_group`. `createAccount`: `investment_group: input.investment_group ?? (input.asset_category === "investment" ? deriveInvestmentGroup(input.name) : null)`. `updateAccount`: `if (input.investment_group !== undefined) values.investment_group = input.investment_group;`.
- `src/lib/schemas/account.ts`: `investment_group: z.string().trim().max(40).nullable().optional()`.

### Task 4 — `/assets` page: kartu per grup
`src/app/(app)/assets/page.tsx`: ganti `assets.filter(non-liquid).map(AssetCard)` → `investmentGroups.map(g => <GroupCard href={`/assets/${encodeURIComponent(g.key)}`} label total />)`. `AssetCard` → jadi `Link`. Privacy mask tetap.

### Task 5 — `/assets/[group]/page.tsx` (baru)
`"use client"`, `use(params)`, `useAssets()`, cari `investmentGroups.find(g => g.key === decodeURIComponent(group))`. Header gradient (copy `/accounts/[id]` style: back → `/assets`, judul = label, total besar). Body: card list sub-produk — baris: visual/inisial + `productLabel(name)` + `formatCurrency(current_balance)` (mask). Not found → "Group not found." + link back. English wording.

### Task 6 — Picker optgroup
`TransactionForm.tsx:81` + `FilterBar.tsx:60`: tambah `group` (D5). Kalau `AccountRow` di hook picker belum bawa `investment_group` → sudah dari Task 3.

### Task 7 — AccountBottomSheet field group (D7)
State `investmentGroup`; kirim di create/update hanya kalau investment.

### Task 8 — Migrate script (D6)
`scripts/migrate-sheet.ts` `parseInvestmentDest` Tipe C + insert akun baru set `investment_group: deriveInvestmentGroup(name)`. Import dari `@/lib/investment` (cek script sudah pakai alias `@/` → ya, `@/db/schema`).
Verifikasi: `pnpm migrate 2026 --dry` (USER yang jalankan) → "New accounts to create: 0" + tidak ada dup.

### Task 9 — Docs
AGENTS.md (section Investment: model sub-produk + grup + route + helper), README.md (Net Worth grouped + detail page), docs/roadmap.md (bf-z6w done, bf-3ai next). Update bd memory `bf-z6w-investment-detail` (status).

---

## 4. Files Changed

| File | Perubahan |
|---|---|
| `src/lib/investment.ts` (+test) | baru — `deriveInvestmentGroup`, `productLabel` |
| `src/db/queries/assets.ts` | `investment_group` + `investmentGroups` |
| `src/db/queries/accounts.ts` | select/map/create/update `investment_group` |
| `src/lib/schemas/account.ts` | field |
| `src/app/(app)/assets/page.tsx` | kartu per grup |
| `src/app/(app)/assets/[group]/page.tsx` | baru — detail sub-produk |
| `src/app/(app)/transactions/_components/TransactionForm.tsx`, `FilterBar.tsx` | optgroup |
| `src/app/(app)/accounts/_components/AccountBottomSheet.tsx` | field group |
| `scripts/migrate-sheet.ts` | Tipe C + group saat create |
| AGENTS.md / README.md / docs/roadmap.md | docs |

Migration DB: **tidak ada** (kolom sudah ada). Seeding data: SQL MCP (Task 2).

## 5. Verifikasi akhir
1. `npm run build` lolos (user jalankan). 2. `npm run test:run` (unit helper). 3. Net Worth SQL = 50.831.765,27. 4. `/assets` tampil 7 kartu grup + Accounts; tap Emas → 7 sub-produk, Σ = 7.830.000. 5. `pnpm migrate 2026 --dry` → 0 akun baru, 0 tx baru.

## 6. Deferred (YAGNI)
- Goal per sub-produk: mekanisme sudah ada (`savings_goals.account_id`, semua NULL). Isi data + tampil di detail = issue terpisah kalau diminta.
- Reorder/collapse grup, group "Other", multi-lot emas (berat/karat) — tidak.

## CLAUDE.md Check
- [ ] Pattern baru: akun per sub-produk + `investment_group` (kolom eksplisit, nama = default) → AGENTS.md
- [ ] Route baru `/assets/[group]` → AGENTS.md Feature Pages
- [ ] Helper `src/lib/investment.ts` → AGENTS.md
- [ ] Migrate: Tipe C dest per sub-produk + `opening-2026-nl-<sub>` → AGENTS.md "Migrasi Sheet → DB"
- [ ] README + roadmap
