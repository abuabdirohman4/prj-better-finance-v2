# bf-yts — Akun Non-Liquid + Transfer 2-Field Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** User bisa bikin akun non-liquid (investment/property/other) via picker Kategori Aset; transfer form pisah "Ke Akun" (wajib) + "Untuk Goal" (opsional); goal progress derive dari `goal_id` transaksi; drop `goals.linked_account_id`.

**Architecture:** `accounts.asset_category` column sudah ada — cuma expose di form + schema + query insert. Transfer form pisah dropdown gabungan jadi 2 field independen; `to_account_id` langsung dari field "Ke Akun", `goal_id` opsional dari field "Untuk Goal". `linked_account_id` di-drop dari schema + semua goal touchpoint (form wajib→hapus, query join, actions validation, migration).

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, Supabase Postgres, TanStack Query v5, Zod, Vitest.

**Design ref:** `docs/plans/2026-07-23-bf-yts-akun-nonliquid-goal-transfer-design.md`

**Catatan build/test:** User yang jalankan `npm run build` / `npm run test:run` (jangan Claude — boros token). Claude analisa hasil. Migration DB via Supabase MCP `apply_migration` atau `drizzle-kit generate` → user apply.

---

## Bagian A — Akun Non-Liquid (picker Kategori Aset)

Paling independen, kerjakan dulu. Tidak menyentuh goals/transfer.

### Task A1: Tambah `asset_category` ke schema Zod akun

**Files:**
- Modify: `src/lib/schemas/account.ts:3-9`

**Step 1: Tambah field ke `createAccountSchema`**

```ts
import { z } from "zod";

export const createAccountSchema = z.object({
  name: z.string().min(1, "Nama akun wajib diisi").max(50),
  account_type_id: z.string().uuid("Tipe akun tidak valid"),
  current_balance: z.number(),
  asset_category: z.enum(["liquid", "investment", "property", "other"]).default("liquid"),
  include_in_net_worth: z.boolean(),
  sort_order: z.number(),
});

export const updateAccountSchema = createAccountSchema.partial();

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
```

**Step 2: Commit**

```bash
git add src/lib/schemas/account.ts
git commit -m "feat(accounts): asset_category di schema Zod (bf-yts)"
```

---

### Task A2: Passthrough `asset_category` di query create + update

**Files:**
- Modify: `src/db/queries/accounts.ts:119-134` (createAccount insert)
- Modify: `src/db/queries/accounts.ts:145-155` (updateAccount values)

**Step 1: createAccount — tambah `asset_category` ke `.values()`**

Sisipkan setelah `current_balance: String(input.current_balance),`:

```ts
      current_balance: String(input.current_balance),
      asset_category: input.asset_category,
      include_in_net_worth: input.include_in_net_worth,
```

**Step 2: updateAccount — tambah passthrough**

Di blok `if (input.xxx !== undefined)` (sekitar line 150-151), tambah:

```ts
  if (input.asset_category !== undefined) values.asset_category = input.asset_category;
```

**Step 3: Commit**

```bash
git add src/db/queries/accounts.ts
git commit -m "feat(accounts): passthrough asset_category create+update (bf-yts)"
```

---

### Task A3: Picker Kategori Aset di form akun

**Files:**
- Modify: `src/app/(app)/accounts/_components/AccountBottomSheet.tsx`

**Step 1: Tambah state (setelah `const [balance, setBalance]`)**

```tsx
  const [assetCategory, setAssetCategory] = useState<
    "liquid" | "investment" | "property" | "other"
  >((account?.asset_category as "liquid" | "investment" | "property" | "other") ?? "liquid");
```

**Step 2: Kirim di create payload** (blok `createAccountAction({...})`)

Tambah `asset_category: assetCategory,` ke object.

**Step 3: Kirim di update payload** (blok `updateAccountAction(...)`)

Tambah:
```tsx
          asset_category:
            assetCategory !== account!.asset_category ? assetCategory : undefined,
```

**Step 4: Tambah dropdown JSX** (setelah blok "Tipe Akun", sebelum "Saldo")

```tsx
          {/* Kategori Aset */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori Aset
            </label>
            <select
              value={assetCategory}
              onChange={(e) =>
                setAssetCategory(
                  e.target.value as "liquid" | "investment" | "property" | "other"
                )
              }
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="liquid">🟢 Liquid — uang cair (Bank/Cash/E-wallet)</option>
              <option value="investment">📈 Investment — Reksadana/Saham/Crypto</option>
              <option value="property">🏠 Property — Emas/Tanah/Rumah</option>
              <option value="other">📦 Other — BPJS/JHT/lainnya</option>
            </select>
          </div>
```

**Step 5: User jalankan `npm run build`** — pastikan lolos (typecheck asset_category).

**Step 6: Commit**

```bash
git add "src/app/(app)/accounts/_components/AccountBottomSheet.tsx"
git commit -m "feat(accounts): picker Kategori Aset di form akun (bf-yts)"
```

> **Catatan:** `AccountRow` (accounts.ts:14) sudah punya `asset_category: string`, jadi `account?.asset_category` tersedia di edit mode. Tidak perlu ubah query select.

---

## Bagian B — Transfer 2-Field

Pisah dropdown gabungan → "Ke Akun" (wajib) + "Untuk Goal" (opsional).

### Task B1: Rewrite state + options + routing di TransactionForm

**Files:**
- Modify: `src/app/(app)/transactions/_components/TransactionForm.tsx`

**Step 1: Ganti state `toAccountId` gabungan → dua state terpisah**

Ganti (sekitar line 64-66):
```tsx
  const [toAccountId, setToAccountId] = useState(
    init?.goal_id ? `goal:${init.goal_id}` : init?.to_account_id ? `acc:${init.to_account_id}` : ""
  );
```
menjadi:
```tsx
  const [toAccountId, setToAccountId] = useState(init?.to_account_id ?? "");
  const [goalId, setGoalId] = useState(init?.goal_id ?? "");
```

**Step 2: Ganti `toAccountOptions` (buang prefix acc:/goal:, buang linked_account_name)**

```tsx
  const toAccountOptions = accounts
    .filter((a) => a.id !== accountId)
    .map((a) => ({ value: a.id, label: a.name }));

  const goalOptions = goalsForTransfer.map((g) => ({ value: g.id, label: g.name }));
```

**Step 3: Ganti blok routing di `handleSubmit` (line 120-142)**

```tsx
    const submitData: UpdateTransactionInput = {
      transaction_date: date,
      transaction_type: txType,
      account_id: accountId,
      to_account_id: txType === "transfer" ? toAccountId || undefined : undefined,
      goal_id: txType === "transfer" ? goalId || undefined : undefined,
      category_id: txType !== "transfer" ? categoryId || undefined : undefined,
      amount,
      note: note.trim(),
    };
    onSubmit(submitData);
```

Hapus seluruh blok lama `let finalToAccount / finalGoalId / if (toAccountId.startsWith("acc:"))...`.

**Step 4: Ganti JSX — "Ke Akun" pakai `toAccountOptions` polos**

Di blok `txType === "transfer" ?` (sekitar line 192), ganti `options={toAccountOptions}` tetap, tapi `value={toAccountId}` `onChange={setToAccountId}` (sudah plain id sekarang). Placeholder tetap "Pilih tujuan".

**Step 5: Tambah field "Untuk Goal" (opsional) — setelah Row 1, sebelum Row 2**

```tsx
      {/* Untuk Goal — opsional, hanya transfer */}
      {txType === "transfer" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Untuk Goal <span className="text-gray-400 text-xs">(opsional)</span>
          </label>
          <SingleSelect
            options={goalOptions}
            value={goalId}
            onChange={setGoalId}
            placeholder="Tanpa goal"
            searchable
            direction="up"
          />
        </div>
      )}
```

**Step 6: User jalankan `npm run build`** — pastikan lolos.

**Step 7: Commit**

```bash
git add "src/app/(app)/transactions/_components/TransactionForm.tsx"
git commit -m "feat(transactions): transfer pisah Ke Akun + Untuk Goal (bf-yts)"
```

---

### Task B2: Bersihkan `getGoalsForTransferAction` (buang filter linked_account)

**Files:**
- Modify: `src/app/(app)/transactions/actions.ts:43-53`

**Step 1: Buang filter `linked_account_id !== null`**

```ts
export async function getGoalsForTransferAction(): Promise<ServerActionResult<GoalSelectRow[]>> {
  try {
    const user = await requireUser();
    const all = await getGoalsForSelect(user.id);
    return { success: true, data: all };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}
```

**Step 2: Commit**

```bash
git add "src/app/(app)/transactions/actions.ts"
git commit -m "feat(transactions): semua goal bisa di-tag (buang filter linked_account) (bf-yts)"
```

> **Catatan:** Validasi goal ownership di `createTransactionAction`/edit (line 79, 140) sudah generik (`goals.find((g) => g.id === ...)`) — TIDAK bergantung linked_account. Tidak perlu diubah.

---

## Bagian C — Drop `linked_account_id` dari Goals

Paling banyak touchpoint. Kerjakan terakhir setelah B jalan.

### Task C1: Goal schema Zod — hapus `linked_account_id`

**Files:**
- Modify: `src/lib/schemas/goal.ts:12`

Hapus baris:
```ts
  linked_account_id: z.string().uuid("Akun terhubung wajib dipilih"),
```

Commit: `refactor(goals): drop linked_account_id dari schema (bf-yts)`

---

### Task C2: GoalBottomSheet — hapus field Akun Terhubung

**Files:**
- Modify: `src/app/(app)/goals/_components/GoalBottomSheet.tsx`

Hapus:
- state `const [linkedAccountId, setLinkedAccountId] = useState("");` (line 33)
- `setLinkedAccountId(goal?.linked_account_id || "");` (line 54)
- guard `if (!linkedAccountId) return setErrorMsg(...)` (line 72)
- `linked_account_id: linkedAccountId,` di payload (line 83)
- blok JSX "Akun Terhubung" (label + SingleSelect, sekitar line 200-205)
- prop `accounts` jika tak dipakai lagi (cek dulu — mungkin masih dipakai di tempat lain di file; kalau tidak, hapus dari `Props` + destructure). Jika ragu, biarkan prop tetap ada (harmless).

Commit: `refactor(goals): hapus field Akun Terhubung dari form (bf-yts)`

---

### Task C3: goals.ts queries — buang linked_account dari getGoals, createGoal, updateGoal, getGoalsForSelect

**Files:**
- Modify: `src/db/queries/goals.ts`

Hapus/sesuaikan (baris approx, verifikasi via grep sebelum edit):
- `GoalRow` interface: hapus `linked_account_id`, `linked_account_name` (line 15-16)
- `getGoals` select: hapus `linked_account_id`, `linked_account_name` + `.leftJoin(accounts, ...)` (line 42-43, 47)
- `createGoal` input type + insert: hapus `linked_account_id` (line 66, 79)
- `updateGoal` input type + set: hapus `linked_account_id` (line 96, 108)
- `GoalSelectRow` interface: hapus `linked_account_id`, `linked_account_name` (line 125-127)
- `getGoalsForSelect` select: hapus `linked_account_id`, `linked_account_name` + `.leftJoin` (line 136-137, 141)

> **PENTING:** Setelah hapus join `accounts` di getGoals/getGoalsForSelect, cek import `accounts` masih dipakai di file (mungkin dipakai getGoals untuk collected derivation via transactions — kalau tidak, hapus import). `collected_amount` derivation dari `transactions.goal_id` TETAP (jangan sentuh).

Commit: `refactor(goals): drop linked_account dari semua query (bf-yts)`

---

### Task C4: goals/actions.ts — buang validasi linked_account

**Files:**
- Modify: `src/app/(app)/goals/actions.ts:36-38, 65-67`

Hapus dua blok:
```ts
    if (parsed.data.linked_account_id) {
      const account = await getAccountById(user.id, parsed.data.linked_account_id);
      ...
    }
```
(di createGoalAction + updateGoalAction). Cek import `getAccountById` masih dipakai — kalau tidak, hapus.

Commit: `refactor(goals): buang validasi linked_account di actions (bf-yts)`

---

### Task C5: GoalCard + types — hapus tampilan linked_account

**Files:**
- Modify: `src/app/(app)/goals/_components/GoalCard.tsx:36-40`
- Modify: `src/types/index.ts:132, 147-148`

- GoalCard: hapus blok `{goal.linked_account_name && (...)}`.
- types/index.ts: hapus `linked_account_id`, `linked_account_name`, `linked_account_balance` dari interface Goal (verifikasi field mana yang dipakai — kalau `linked_account_balance` dipakai di tempat lain, grep dulu).

Commit: `refactor(goals): hapus tampilan linked_account di card + types (bf-yts)`

---

### Task C6: Migration — DROP COLUMN

**Files:**
- Modify: `src/db/schema.ts:197` (hapus `linked_account_id: uuid(...)...`)
- Create: migration SQL

**Step 1: Hapus kolom di schema.ts** (line 197):
```ts
  linked_account_id: uuid("linked_account_id").references(() => accounts.id),
```

**Step 2: Generate + apply migration**

Opsi A (drizzle): `npm run db:generate` → user review SQL → `npm run db:migrate`.
Opsi B (Supabase MCP): apply migration:
```sql
ALTER TABLE savings_goals DROP COLUMN IF EXISTS linked_account_id;
```

> **User yang apply** (irreversible schema change — konfirmasi dulu). Backup: kolom kosong data karena progress derive dari goal_id, aman di-drop.

**Step 3: User jalankan `npm run build`** — pastikan tidak ada referensi `linked_account_id` tersisa (typecheck akan gagal kalau ada).

Commit: `refactor(goals): DROP COLUMN linked_account_id + migration (bf-yts)`

---

## Verifikasi Akhir

1. User jalankan `npm run build` → **WAJIB lolos** (catch semua typo query/import).
2. User jalankan `npm run test:run` → balance math tests tetap hijau (tidak disentuh, tapi konfirmasi).
3. Manual smoke (user): bikin akun Reksadana kategori Investment → muncul di Net Worth non-liquid. Transfer 5jt ke Jago tag Dana Darurat → collected Dana Darurat naik. Transfer 7jt ke Bibit tag Dana Darurat → collected = 12jt.
4. Close issue: `bd close bf-yts`.

## Debt tercatat

Form akun & transfer wording Indonesian — AGENTS.md English-first. Translate saat i18n pass (bf-bp5).

## Grep-verify checklist (sebelum close)

```bash
grep -rn "linked_account" src/   # harus KOSONG (0 hasil)
```
