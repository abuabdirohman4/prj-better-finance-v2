# bf-6rl — Goal Account Linkage: Simpan di Akun Mana + Pre-fill Transfer

**Date:** 2026-08-11  
**Issue:** bf-6rl  
**Status:** Plan  
**Migration:** ✅ MCP (Claude eksekusi — `account_id` FK di `savings_goals`)

---

## Context

Goal tidak punya info disimpan di akun mana.
- Goal card tidak tampilkan "disimpan di Jago/Bibit/dll" — user tak tau tanpa buka spreadsheet
- Saat transfer ke goal, user pilih akun tujuan manual — harusnya pre-fill dari `goal.account_id`

**Solusi:** kolom `account_id` (nullable FK → accounts) di `savings_goals`.
- Form edit goal: field "Akun Penyimpanan"
- Goal card: tampil nama akun
- Form transaksi Transfer: pilih goal → auto set `to_account_id = goal.account_id` (override manual boleh)

Relates: bf-btz (ledger), bf-3ai (tracker).

---

## Tasks

### Task 1 — DB Migration ✅ SELESAI (Claude via MCP 2026-08-11) — schema.ts sudah ter-update

### Task 1 — DB Migration ⚡ CLAUDE VIA MCP

```sql
ALTER TABLE savings_goals 
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id) ON DELETE SET NULL;
```

Update `src/db/schema.ts` — `savingsGoals`:
```ts
account_id: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
```
> ⚠️ `savingsGoals` didefinisikan SEBELUM `accounts`? Cek urutan di schema.ts. `accounts` didefinisikan lebih dulu (line ~55), `savingsGoals` di bawah (~190) → FK reference OK. Kalau ada circular ref issue, pakai `AnyPgColumn` type hint.

⚡ Dieksekusi Claude saat planning. Antigravity mulai dari Task 2.

### Task 2 — Query: include account_id + account_name di getGoals

**File:** `src/db/queries/goals.ts`

Tambah `account_id` + `account_name` ke `GoalRow`:
```ts
account_id: string | null;
account_name: string | null;
```

Update `getGoals` — leftJoin accounts:
```ts
import { accounts } from "@/db/schema";
// di select:
account_id: savingsGoals.account_id,
account_name: accounts.name,
// di query, tambah:
.leftJoin(accounts, eq(accounts.id, savingsGoals.account_id))
```

Tambah `account_id` ke `createGoal` + `updateGoal` input:
```ts
// createGoal input + values:
account_id: input.account_id ?? null,
// updateGoal:
if (input.account_id !== undefined) set.account_id = input.account_id;
```

Tambah `account_id` ke `GoalSelectRow` + `getGoalsForSelect` (dipakai transfer pre-fill):
```ts
// GoalSelectRow:
account_id: string | null;
// getGoalsForSelect select:
account_id: savingsGoals.account_id,
```

### Task 3 — Schema: account_id di goal input

**File:** `src/lib/schemas/goal.ts`

```ts
export const createGoalSchema = z.object({
  // ... existing ...
  account_id: z.string().uuid().optional().nullable(),
});
```
> `updateGoalSchema` extends dari createGoalSchema.partial() → otomatis ikut.

### Task 4 — Ownership guard di actions

**File:** `src/app/(app)/goals/actions.ts`

Di `createGoalAction` + `updateGoalAction`: kalau `account_id` diisi, validasi milik user:
```ts
if (parsed.data.account_id) {
  const acc = await getAccountById(user.id, parsed.data.account_id);
  if (!acc) return { success: false, message: "Akun tidak ditemukan." };
}
```
> Import `getAccountById` dari `@/db/queries/accounts`.

### Task 5 — Form: field "Akun Penyimpanan" di GoalBottomSheet

**File:** `src/app/(app)/goals/_components/GoalBottomSheet.tsx`

Tambah state `accountId` + fetch accounts list (via `getAccounts` action atau prop). Render SingleSelect:
```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Akun Penyimpanan (Opsional)</label>
  <SingleSelect
    options={accountOptions}
    value={accountId}
    onChange={setAccountId}
    placeholder="Pilih akun"
    searchable
    direction="up"
  />
</div>
```

Fetch accounts — pakai `useQuery` dengan `getAccounts` action (query key `accountKeys.list()`). Init `accountId` dari `goal?.account_id`. Pass `account_id: accountId || null` ke `onSave`.

> Cek: GoalBottomSheet perlu tahu daftar akun. Tambah `useQuery` di komponen (import `getAccounts` dari `../../accounts/actions` atau bikin action baru di goals). Simplest: `getAccounts` sudah ada di accounts/actions.ts — import langsung.

### Task 6 — Goal card: tampil "disimpan di X"

**File:** `src/app/(app)/goals/_components/GoalCard.tsx`

Setelah nama goal atau di baris deadline, tampil akun:
```tsx
{goal.account_name && (
  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
    <Wallet className="w-3.5 h-3.5" />
    <span>Disimpan di {goal.account_name}</span>
  </div>
)}
```
> Import `Wallet` dari lucide-react.

### Task 7 — Transfer pre-fill di TransactionForm

**File:** `src/app/(app)/transactions/_components/TransactionForm.tsx`

Saat user pilih goal di transfer → auto-set `toAccountId` dari `goal.account_id` (kalau ada dan user belum set manual).

`goalsForTransfer` sekarang dari `getGoalsForTransferAction` — sudah punya `account_id` (Task 2). Update handler goal change:
```tsx
function handleGoalChange(newGoalId: string) {
  setGoalId(newGoalId);
  const goal = goalsForTransfer.find(g => g.id === newGoalId);
  if (goal?.account_id && !toAccountId) {
    setToAccountId(goal.account_id);
  }
}
// pakai handleGoalChange di SingleSelect goal onChange
```

---

## Files Changed

| File | Perubahan |
|---|---|
| `src/db/schema.ts` | `account_id` FK di savingsGoals (migration Task 1) |
| `src/db/queries/goals.ts` | `GoalRow`/`GoalSelectRow` + account_id, join accounts, create/update |
| `src/lib/schemas/goal.ts` | `account_id` field |
| `src/app/(app)/goals/actions.ts` | Ownership guard |
| `src/app/(app)/goals/_components/GoalBottomSheet.tsx` | Field akun penyimpanan |
| `src/app/(app)/goals/_components/GoalCard.tsx` | Tampil "disimpan di X" |
| `src/app/(app)/transactions/_components/TransactionForm.tsx` | Pre-fill to_account dari goal |
| Migration | `ALTER TABLE savings_goals ADD account_id` |

Threshold: 7 files + migration → **Mode A (Antigravity)** (migration Claude via MCP)

---

## CLAUDE.md Check
- [ ] Pattern baru: `savings_goals.account_id` = akun penyimpanan, pre-fill transfer
- [ ] Kolom baru (bukan tabel) — dokumentasikan
- [ ] Update AGENTS.md: goal-account linkage
