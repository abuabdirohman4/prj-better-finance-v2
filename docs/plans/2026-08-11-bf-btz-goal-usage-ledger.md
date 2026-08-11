# bf-btz — Goal Usage Ledger: Spend-Down + History Per Goal

**Date:** 2026-08-11  
**Issue:** bf-btz  
**Status:** Plan

---

## Context (dari beads bf-btz)

Goal punya buku riwayat sendiri — bukan hanya angka progress.

**Konsep kunci (anti double-count):**
- Pemakaian tabungan (`spending` ber-`goal_id`) kecatat di buku goal, **TIDAK** di budget bulanan
- Budget bulanan = pengeluaran murni dari income
- Goal ledger = pemakaian tabungan (terpisah)
- Contoh: income 5jt, expense normal 4jt, pakai dana darurat 2jt → budget tetap 4jt (bukan 6jt), goal collected turun 2jt

**Yang dibutuhkan:**
1. `spending` transaction dengan `goal_id` → **kurangi** `collected` goal (bukan hanya transfer yang menambah)
2. Di halaman Goals: per-goal, ada expandable riwayat (ledger) — kapan ditambah, kapan dipakai
3. `collected_amount` derivation perlu update: sekarang hanya SUM transfer, harus dikurangi spending ber-goal_id

**Catatan:** sekarang `goal_id` di schema hanya dipakai untuk transfer (top-up). Perlu extend ke spending (withdrawal/usage).

---

## Design

### Alur transaksi goal

| Jenis | type | goal_id | Efek |
|---|---|---|---|
| Nabung ke goal | `transfer` | ✓ | `to_account_id` = rekening tabungan, collected +amount |
| Pakai tabungan | `spending` | ✓ | `account_id` = rekening tabungan yang dipakai, collected -amount |

Dalam satu tampilan goal:
```
[Goal Card: Dana Darurat]
  Collected: 5jt / Target: 10jt [50%]
  [History row: +500rb  nabung  2026-08-05]
  [History row: -200rb  dipakai: Health  2026-07-20]
  [History row: +1jt    nabung  2026-07-01]
```

### Transaction Form

Spending + goal_id = "spending dari tabungan". Form perlu:
- Saat `txType === "spending"`, tampilkan optional field "From Goal" (SingleSelect goals)
- `account_id` = akun dari mana kas dikeluarkan (akun liquid yang linked ke goal itu)

---

## Tasks

### Task 1 — Update `getGoals` query — collected hitung spending

**File:** `src/db/queries/goals.ts`

Saat ini collected = `base + SUM(transfer)`. Perlu juga `-SUM(spending ber-goal_id)`.

```ts
// Tambah subquery spending (withdrawal)
const withdrawalsByGoal = db
  .select({
    goal_id: transactions.goal_id,
    total: sql<number>`SUM(${transactions.amount}::numeric)`.as("total"),
  })
  .from(transactions)
  .where(
    and(
      eq(transactions.user_id, userId),
      eq(transactions.transaction_type, "spending"),
      isNotNull(transactions.goal_id),
      isNull(transactions.deleted_at),
    ),
  )
  .groupBy(transactions.goal_id)
  .as("withdrawals_by_goal");

// Update main query — leftJoin withdrawals juga
const rows = await db
  .select({
    // ... existing fields ...
    collected_amount: sql<number>`
      ${savingsGoals.collected_amount}::numeric 
      + COALESCE(${transfersByGoal.total}, 0) 
      - COALESCE(${withdrawalsByGoal.total}, 0)
    `,
  })
  .from(savingsGoals)
  .leftJoin(transfersByGoal, eq(transfersByGoal.goal_id, savingsGoals.id))
  .leftJoin(withdrawalsByGoal, eq(withdrawalsByGoal.goal_id, savingsGoals.id))
  // ... rest same
```

### Task 2 — Tambah `getGoalLedger` query

**File:** `src/db/queries/goals.ts`

```ts
export interface GoalLedgerRow {
  id: string;
  transaction_date: string;
  transaction_type: "transfer" | "spending";
  amount: number;
  note: string | null;
  category_name: string | null;
  // sign: + untuk transfer (top-up), - untuk spending (withdrawal)
}

export async function getGoalLedger(
  userId: string,
  goalId: string
): Promise<GoalLedgerRow[]> {
  const rows = await db
    .select({
      id: transactions.id,
      transaction_date: transactions.transaction_date,
      transaction_type: transactions.transaction_type,
      amount: sql<number>`${transactions.amount}::numeric`,
      note: transactions.note,
      category_name: categories.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(categories.id, transactions.category_id))
    .where(
      and(
        eq(transactions.user_id, userId),
        eq(transactions.goal_id, goalId),
        isNull(transactions.deleted_at),
        // hanya transfer (top-up) dan spending (withdrawal)
        sql`${transactions.transaction_type} IN ('transfer', 'spending')`,
      ),
    )
    .orderBy(desc(transactions.transaction_date), desc(transactions.created_at));

  return rows.map(r => ({
    id: r.id,
    transaction_date: r.transaction_date,
    transaction_type: r.transaction_type as "transfer" | "spending",
    amount: Number(r.amount),
    note: r.note,
    category_name: r.category_name,
  }));
}
```

### Task 3 — Tambah `getGoalLedgerAction` di goals/actions.ts

**File:** `src/app/(app)/goals/actions.ts`

```ts
import { getGoalLedger, type GoalLedgerRow } from "@/db/queries/goals";

export async function getGoalLedgerAction(
  goalId: string
): Promise<ServerActionResult<GoalLedgerRow[]>> {
  try {
    const user = await requireUser();
    const parsed = z.string().uuid().safeParse(goalId);
    if (!parsed.success) return { success: false, message: "ID goal tidak valid." };
    const data = await getGoalLedger(user.id, goalId);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}
```

### Task 4 — Tambah `GoalLedger` component

**File:** `src/app/(app)/goals/_components/GoalLedger.tsx` (baru)

```tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/helper";
import { getGoalLedgerAction } from "../actions";
import type { GoalLedgerRow } from "@/db/queries/goals";

interface Props {
  goalId: string;
  hideBalances: boolean;
}

export function GoalLedger({ goalId, hideBalances }: Props) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["goal-ledger", goalId],
    queryFn: async () => {
      const res = await getGoalLedgerAction(goalId);
      if (!res.success) throw new Error(res.message);
      return res.data!;
    },
    staleTime: 30_000,
  });

  if (isLoading) return <div className="h-20 animate-pulse bg-gray-100 rounded-xl" />;
  if (data.length === 0) return (
    <p className="text-xs text-gray-400 py-3 text-center">No history yet.</p>
  );

  return (
    <div className="divide-y divide-gray-50">
      {data.map(row => (
        <div key={row.id} className="flex items-center justify-between py-2.5 px-1">
          <div>
            <p className="text-xs font-medium text-gray-800">{row.note ?? row.category_name ?? "-"}</p>
            <p className="text-[10px] text-gray-400">{row.transaction_date}</p>
          </div>
          <span className={`text-sm font-bold ${row.transaction_type === "transfer" ? "text-green-600" : "text-red-500"}`}>
            {row.transaction_type === "transfer" ? "+" : "-"}
            {hideBalances ? "•••" : formatCurrency(row.amount, "short")}
          </span>
        </div>
      ))}
    </div>
  );
}
```

### Task 5 — Update `GoalCard` — tambah expandable ledger

**File:** `src/app/(app)/goals/_components/GoalCard.tsx`

Tambah toggle expand state dan render `GoalLedger` di bawah card:
```tsx
const [expanded, setExpanded] = useState(false);

// Di dalam JSX, setelah progress bar:
<button onClick={() => setExpanded(!expanded)} className="w-full text-xs text-gray-400 pt-2 pb-1 text-center">
  {expanded ? "Hide history ▲" : "Show history ▾"}
</button>
{expanded && <GoalLedger goalId={goal.id} hideBalances={hideBalances} />}
```

> Kalau `GoalCard` tidak ada file tersendiri (mungkin inline di `GoalCategoryCard`), tambah expand di sana. Executor: cek `src/app/(app)/goals/_components/` dulu.

### Task 6 — Update `TransactionForm` — spending bisa pilih goal

**File:** `src/app/(app)/transactions/_components/TransactionForm.tsx`

Saat ini `goal_id` hanya muncul untuk `txType === "transfer"`. Perlu juga untuk `txType === "spending"`:

```tsx
{/* Goal — muncul untuk transfer DAN spending */}
{(txType === "transfer" || txType === "spending") && (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-gray-700">
      {txType === "transfer" ? "Untuk Goal" : "From Goal"}{" "}
      <span className="text-gray-400 text-xs">(optional)</span>
    </label>
    <SingleSelect
      options={goalOptions}
      value={goalId}
      onChange={setGoalId}
      placeholder="No goal"
      searchable
      direction="up"
    />
  </div>
)}
```

Fetch goals sudah ada (via `getGoalsForTransferAction`). Rename label saja — tidak perlu action baru.

> `goalsRes` query saat ini hanya enabled ketika `txType === "transfer"`. Update enabled condition:
> ```ts
> enabled: txType === "transfer" || txType === "spending",
> ```

### Task 7 — Update `createTransactionAction` — spending + goal_id valid

**File:** `src/app/(app)/transactions/actions.ts`

Existing validation sudah check `goal_id` untuk semua tipe transaksi. Tidak ada perubahan di action layer — goal_id sudah valid untuk spending juga karena validasi generic. **Tidak perlu perubahan di action.**

---

## Files Changed

| File | Perubahan |
|---|---|
| `src/db/queries/goals.ts` | `getGoals` — collected kurangi spending; tambah `getGoalLedger` |
| `src/app/(app)/goals/actions.ts` | Tambah `getGoalLedgerAction` |
| `src/app/(app)/goals/_components/GoalLedger.tsx` | Component baru |
| `src/app/(app)/goals/_components/GoalCard.tsx` | Expandable ledger |
| `src/app/(app)/transactions/_components/TransactionForm.tsx` | Spending + goal_id picker |

Threshold: 5 files → **Mode A (Antigravity)**

---

## Edge Cases

- `collected_amount` bisa jadi negatif jika spending > transfer. Clamp di 0 di UI tapi simpan nilai asli.
- Kalau user hapus spending ber-goal_id → balance reversal sudah handled di `deleteTransactionAction` (sudah ada). Collected re-derived otomatis dari query.

---

## CLAUDE.md Check
- [ ] Pattern baru: `spending` ber-`goal_id` = withdrawal dari goal (kurangi collected)
- [ ] `getGoalLedger` query baru perlu didokumentasikan di AGENTS.md
- [ ] Tidak ada route baru
- [ ] Update AGENTS.md: dokumentasikan goal ledger pattern + spending withdrawal
