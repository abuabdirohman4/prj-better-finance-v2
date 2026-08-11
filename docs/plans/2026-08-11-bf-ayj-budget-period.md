# bf-ayj — Budget Period: Pisah Transaction Date dari Alokasi Bulan

**Date:** 2026-08-11  
**Issue:** bf-ayj  
**Status:** Plan  
**Migration:** ✅ MCP (Claude eksekusi — `budget_period` di `transactions`)

---

## Context

Gaji masuk fisik akhir bulan (25 Juli) tapi dialokasikan untuk keperluan bulan berikutnya (Agustus).
- `transaction_date` = tanggal asli (jujur ke kas)
- Butuh field terpisah `budget_period` = periode alokasi (intent) supaya laporan bulanan & budget menghitung transaksi di bulan tujuan

**Existing:**
- `transactions.source_month` (text, nullable) — sudah ada, menyimpan tab asal dari import (mis `"2026-Aug"`). Bisa jadi basis, TAPI formatnya text tab-name, bukan struktur `year-month` bersih.

**Keputusan:** tambah kolom `budget_period` bertipe `date` (pakai hari 1 tiap bulan sebagai konvensi, mis `2026-08-01`) — lebih query-friendly daripada text `source_month`. Kalau `budget_period` NULL → fallback ke `transaction_date` (backward compat, transaksi lama tetap dihitung di bulan transaksinya).

**Dampak:** semua query yang filter by bulan (budgets, weekly, dashboard) harus pakai `COALESCE(budget_period, transaction_date)` untuk penentuan bulan alokasi.

---

## Design

```
Transaksi: Gaji Rp10jt
  transaction_date = 2026-07-25  (kas naik 25 Juli — fakta)
  budget_period    = 2026-08-01  (dialokasikan Agustus — intent)

Budget Agustus → income actual dihitung dari transaksi ini (walau tanggalnya Juli)
Cashflow Juli  → tetap tampil kas naik 25 Juli (pakai transaction_date)
```

Field opsional di TransactionForm: "Alokasi Bulan" (month picker). Default = bulan dari transaction_date. User bisa override.

---

## Tasks

### Task 1 — DB Migration ✅ SELESAI (Claude via MCP 2026-08-11) — schema.ts sudah ter-update

### Task 1 — DB Migration ⚡ CLAUDE VIA MCP

```sql
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS budget_period date;
```

Update `src/db/schema.ts` — `transactions`, setelah `source_month`:
```ts
budget_period: date("budget_period"),
```

⚡ Dieksekusi Claude saat planning. Antigravity mulai dari Task 2.

### Task 2 — Backfill budget_period dari source_month (opsional, Claude via MCP)

Data import 2026 punya `source_month` (mis `"2026-Aug"`). Bisa backfill:
```sql
-- Contoh — sesuaikan format source_month aktual
UPDATE transactions SET budget_period = 
  to_date(source_month, 'YYYY-Mon')  -- kalau format "2026-Aug"
WHERE budget_period IS NULL AND source_month IS NOT NULL AND user_id = '<user_id>';
```
> ⚠️ Cek format `source_month` di DB dulu (`SELECT DISTINCT source_month FROM transactions LIMIT 20`). Jangan assume format. Opsional — tanya user apakah mau backfill.

### Task 3 — Schema + insert budget_period

**File:** `src/lib/schemas/transaction.ts`
```ts
budget_period: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
```

**File:** `src/db/queries/transactions.ts` — `createTransaction` + `updateTransaction`:
```ts
// createTransaction values:
budget_period: input.budget_period ?? null,
// updateTransaction:
if ("budget_period" in input) values.budget_period = input.budget_period ?? null;
```

Tambah `budget_period` ke `TransactionRow` + select di getTransactions/getTransactionById.

### Task 4 — Budget query pakai budget_period

**File:** `src/db/queries/budgets.ts`

`getBudgetsWithSpending` filter transaksi by bulan — ganti `transaction_date` range check dengan `COALESCE(budget_period, transaction_date)`:
```ts
// SEBELUM:
sql`${transactions.transaction_date} >= ${startDate}`,
sql`${transactions.transaction_date} <= ${endDate}`,
// SESUDAH:
sql`COALESCE(${transactions.budget_period}, ${transactions.transaction_date}) >= ${startDate}`,
sql`COALESCE(${transactions.budget_period}, ${transactions.transaction_date}) <= ${endDate}`,
```
Sama untuk `getTransactionsForWeeklyBudget`.

> ⚠️ Kalau bf-4z1 (income budget) sudah merge, `getBudgetsWithSpending` sudah punya `type` param — edit yang sudah ada, jangan duplikat.

### Task 5 — Form: field "Alokasi Bulan"

**File:** `src/app/(app)/transactions/_components/TransactionForm.tsx`

Tambah state `budgetPeriod` (default dari transaction_date bulan-1). Optional field:
```tsx
const [budgetPeriod, setBudgetPeriod] = useState(
  init?.budget_period ?? ""
);

// UI — month input (native month picker → convert ke YYYY-MM-01):
<div className="flex flex-col gap-1.5">
  <label className="text-sm font-medium text-gray-700">
    Alokasi Bulan <span className="text-gray-400 text-xs">(opsional)</span>
  </label>
  <input
    type="month"
    value={budgetPeriod ? budgetPeriod.slice(0, 7) : ""}
    onChange={(e) => setBudgetPeriod(e.target.value ? `${e.target.value}-01` : "")}
    className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
  />
  <p className="text-[11px] text-gray-400">Kosongkan = pakai tanggal transaksi. Isi kalau uang ini untuk bulan lain (mis. gaji akhir bulan untuk bulan depan).</p>
</div>
```

Include `budget_period: budgetPeriod || null` di submitData.

---

## Files Changed

| File | Perubahan |
|---|---|
| `src/db/schema.ts` | `budget_period` date di transactions (migration Task 1) |
| `src/lib/schemas/transaction.ts` | `budget_period` field |
| `src/db/queries/transactions.ts` | insert/update + TransactionRow |
| `src/db/queries/budgets.ts` | COALESCE(budget_period, transaction_date) di filter bulan |
| `src/app/(app)/transactions/_components/TransactionForm.tsx` | Field "Alokasi Bulan" |
| Migration | `ALTER TABLE transactions ADD budget_period date` |

Threshold: 5 files + migration → **Mode A (Antigravity)**

---

## Edge Cases
- `budget_period` NULL → fallback `transaction_date`. Transaksi lama tidak berubah perilaku.
- Weekly budget: `budget_period` di bulan X tapi tanggal di bulan lain → weekly cascade pakai `transaction_date` untuk minggu (weekly = fisik), monthly pakai `budget_period` (alokasi). Diskusi: untuk MVP, weekly tetap pakai transaction_date. Hanya monthly budget yang pakai budget_period.

---

## CLAUDE.md Check
- [ ] Pattern baru: `budget_period` = periode alokasi (intent) vs `transaction_date` (fakta kas). Budget bulanan pakai COALESCE.
- [ ] Kolom baru — dokumentasikan di AGENTS.md
- [ ] Update AGENTS.md: budget_period pattern
