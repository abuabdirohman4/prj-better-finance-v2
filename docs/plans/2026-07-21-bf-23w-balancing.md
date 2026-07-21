# Plan: Account Balancing / Reality Check

## Context

Better Finance v2 — accounts CRUD selesai (bf-05n). Sekarang tambah fitur **balancing** (reality check):
user memasukkan saldo aktual yang mereka hitung sendiri → sistem menyimpan ke `last_reality_check` + `last_reality_check_at`, lalu menampilkan selisih vs `current_balance`.

Sekaligus ubah **navigasi AccountCard**: saat ini tap → edit bottom sheet. Setelah ini tap → navigasi ke halaman detail/balancing (`/accounts/[id]`). Edit akun dipindah ke tombol di halaman detail.

## Referensi v1

v1: `/accounts/balancing?account=Mandiri` (query param nama)
v2: `/accounts/[id]` (dynamic route by ID, lebih robust)

Komponen v1 yang jadi acuan:
- `CalculationBalanceCard` — tampilkan current_balance, last_reality_check, difference
- `RealityCheckForm` — input saldo aktual, tombol update
- `ResultCard` — tampilkan hasil setelah update

## Files Terdampak

```
src/app/(app)/accounts/[id]/
  page.tsx                          — NEW: halaman detail + balancing
  _components/
    CalculationBalanceCard.tsx      — NEW: info saldo sistem + reality check + difference
    RealityCheckForm.tsx            — NEW: input saldo aktual + submit
src/db/queries/accounts.ts          — tambah getAccountById, updateRealityCheck
src/app/(app)/accounts/actions.ts   — tambah getAccountAction, updateRealityCheckAction
src/app/(app)/accounts/page.tsx     — ubah AccountCard onClick: edit sheet → navigate ke [id]
src/app/(app)/accounts/_components/AccountCard.tsx  — opsional: hapus cursor-pointer jika nav via Link
```

## Schema

```ts
accounts {
  last_reality_check: numeric       -- saldo aktual yang user input
  last_reality_check_at: timestamp  -- kapan terakhir di-update
  current_balance: numeric          -- saldo sistem (dari transaksi)
}
```

Difference = `last_reality_check - current_balance`
- > 0: user punya lebih dari yang tercatat (biru)
- < 0: user punya kurang (merah)
- = 0: match (hijau)

## Task 0 — Query layer: `src/db/queries/accounts.ts`

### 0a. getAccountById(userId, accountId)

```ts
export async function getAccountById(userId: string, accountId: string): Promise<AccountRow | null> {
  const rows = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      slug: accounts.slug,
      current_balance: accounts.current_balance,
      last_reality_check: accounts.last_reality_check,
      last_reality_check_at: accounts.last_reality_check_at,
      asset_category: accounts.asset_category,
      icon_name: accounts.icon_name,
      color_hex: accounts.color_hex,
      is_wallet: accounts.is_wallet,
      include_in_net_worth: accounts.include_in_net_worth,
      sort_order: accounts.sort_order,
      account_type_slug: accountTypes.slug,
      account_type_name: accountTypes.name,
    })
    .from(accounts)
    .innerJoin(accountTypes, eq(accountTypes.id, accounts.account_type_id))
    .where(and(eq(accounts.id, accountId), eq(accounts.user_id, userId), eq(accounts.is_active, true)))
    .limit(1);

  return rows.length > 0 ? mapAccountRow(rows[0]) : null;
}
```

### 0b. updateRealityCheck(userId, accountId, realityBalance)

```ts
export async function updateRealityCheck(
  userId: string,
  accountId: string,
  realityBalance: number
): Promise<void> {
  await db
    .update(accounts)
    .set({
      last_reality_check: String(realityBalance),
      last_reality_check_at: new Date(),
      updated_at: new Date(),
    })
    .where(and(eq(accounts.id, accountId), eq(accounts.user_id, userId)));
}
```

## Task 1 — Server Actions: `src/app/(app)/accounts/actions.ts`

Append 2 actions baru:

```ts
export async function getAccountAction(
  accountId: string
): Promise<ServerActionResult<AccountRow>> {
  try {
    const user = await requireUser();
    const account = await getAccountById(user.id, accountId);
    if (!account) return { success: false, message: "Akun tidak ditemukan." };
    return { success: true, data: account };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}

export async function updateRealityCheckAction(
  accountId: string,
  realityBalance: number
): Promise<ServerActionResult<void>> {
  try {
    const user = await requireUser();
    await updateRealityCheck(user.id, accountId, realityBalance);
    return { success: true };
  } catch (error) {
    return { success: false, message: handleApiError(error, "mengupdate data").message };
  }
}
```

## Task 2 — `CalculationBalanceCard.tsx` (NEW)

File: `src/app/(app)/accounts/[id]/_components/CalculationBalanceCard.tsx`

Props:
```ts
interface Props {
  account: AccountRow;
  liveRealityCheck?: number | null; // input user saat ini (sebelum submit)
  hideBalances: boolean;
}
```

UI (port dari v1):
- Header "Calculation Balance"
- Row "Current Balance" → `formatCurrency(account.current_balance)` (superscript untuk bank)
- Row "Reality Balance" → `last_reality_check` atau "Not yet recorded" (italic gray)
- Difference box (conditional, hanya jika ada last_reality_check):
  - Latar belakang biru/merah/hijau sesuai sign
  - Text: `+Rp X` / `-Rp X` / "Perfect Match!"
  - Sub-text: "You have more/less money than recorded" / "Your records are accurate!"
- "Updated Xd ago" di kanan bawah (dari `last_reality_check_at`)
- Privacy mask jika `hideBalances`

```tsx
"use client";
import { formatCurrency, formatLastUpdated } from "@/lib/helper";
import { isBankAccount } from "@/lib/accountVisuals";
import type { AccountRow } from "@/db/queries/accounts";

const MASK = "Rp •••";

export function CalculationBalanceCard({ account, liveRealityCheck, hideBalances }: Props) {
  const isBank = isBankAccount(account.account_type_slug);
  const realityVal = liveRealityCheck ?? account.last_reality_check;
  const diff = realityVal != null ? realityVal - account.current_balance : null;

  const formatBal = (n: number) =>
    hideBalances ? MASK : isBank
      ? <span dangerouslySetInnerHTML={{ __html: formatCurrency(n, "superscript") }} />
      : formatCurrency(n);

  // ... render
}
```

## Task 3 — `RealityCheckForm.tsx` (NEW)

File: `src/app/(app)/accounts/[id]/_components/RealityCheckForm.tsx`

Props:
```ts
interface Props {
  accountName: string;
  value: string;                         // input state (raw digits)
  displayValue: string;                  // formatted "Rp 1.000.000"
  onChange: (raw: string, display: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  lastResult: "success" | "error" | null;
  errorMessage?: string;
}
```

Input formatting: ketik digit saja → format otomatis jadi `Rp 1.000.000` saat onChange.
Pattern dari v1 `useBalancingInput` — tapi v2 pakai simple inline handler tanpa custom hook (lebih mudah di-maintain):

```ts
function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  const raw = e.target.value.replace(/\D/g, ""); // hanya digit
  const num = parseInt(raw || "0", 10);
  const display = raw ? formatCurrency(num) : "";
  onChange(raw, display);
}
```

UI:
- Header "Actual {accountName}"
- `<input type="tel" inputMode="numeric">` — value=displayValue
- Tombol "Update {accountName}" (disabled jika value kosong, loading saat pending)
- Success state: green box "✓ Reality check updated!"
- Error state: red text error message

## Task 4 — `accounts/[id]/page.tsx` (NEW)

File: `src/app/(app)/accounts/[id]/page.tsx`

```tsx
"use client";
import { use, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccountAction, updateRealityCheckAction } from "../actions";
import { CalculationBalanceCard } from "./_components/CalculationBalanceCard";
import { RealityCheckForm } from "./_components/RealityCheckForm";
import { accountKeys } from "@/lib/query";
import { getAccountVisual } from "@/lib/accountVisuals";
import { usePrivacyStore } from "@/stores/privacyStore";

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);  // React 19: params adalah Promise
  // ...
}
```

State:
```ts
const [rawValue, setRawValue] = useState("");
const [displayValue, setDisplayValue] = useState("");
const [lastResult, setLastResult] = useState<"success" | "error" | null>(null);
const [errorMsg, setErrorMsg] = useState<string>();
const [isPending, startTransition] = useTransition();
```

Data fetch:
```ts
const { data: account, isLoading } = useQuery({
  queryKey: accountKeys.detail(id),
  queryFn: async () => {
    const res = await getAccountAction(id);
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },
});
```

Submit handler:
```ts
function handleSubmit() {
  const num = parseInt(rawValue || "0", 10);
  startTransition(async () => {
    const res = await updateRealityCheckAction(id, num);
    if (res.success) {
      setLastResult("success");
      setRawValue("");
      setDisplayValue("");
      // Invalidate untuk update diff di card + accounts list + dashboard
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: accountKeys.list() });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } else {
      setLastResult("error");
      setErrorMsg(res.message);
    }
  });
}
```

Layout:
- Header: `bg-linear-to-r from-blue-600 via-blue-700 to-indigo-800` + wave SVG
  - Back button (`ChevronLeft`) → `/accounts`
  - Nama akun + account type di samping back
  - Tombol edit (Pencil icon) → buka `AccountBottomSheet` dalam mode edit
- Body: `CalculationBalanceCard` + `RealityCheckForm`
- `AccountBottomSheet` di-import dan di-render jika edit mode aktif (reuse dari `../_components/AccountBottomSheet`)

## Task 5 — Update `accounts/page.tsx`

Ganti `onClick={() => setSheet({ mode: "edit", account: a })}` di AccountCard menjadi navigate ke `/accounts/${a.id}`:

```tsx
// Hapus sheet state + AccountBottomSheet import dari page.tsx (dipindah ke [id]/page.tsx)
// AccountCard onClick → router.push atau Link wrapper

// Opsi A (lebih clean): wrap seluruh AccountCard dengan Link
<Link href={`/accounts/${a.id}`} key={a.id}>
  <AccountCard account={a} />
</Link>

// Hapus onClick prop dari AccountCard call (tapi tetap pertahankan prop di komponen untuk fleksibilitas)
```

FAB "+" untuk create tetap di `accounts/page.tsx`.

**Perubahan:**
- Import `AccountBottomSheet` dari `accounts/page.tsx` → hapus
- State `sheet` untuk edit → hapus (create sheet tetap)
- `getAccountTypesAction` query tetap ada (untuk FAB create)
- `handleSuccess` invalidation tetap ada

## Task 6 — Type check

```bash
npx tsc --noEmit
# Expected: no errors
```

## Urutan Eksekusi

1. Task 0 — query layer
2. Task 1 — Server Actions
3. Task 2 — CalculationBalanceCard component
4. Task 3 — RealityCheckForm component
5. Task 4 — accounts/[id]/page.tsx
6. Task 5 — update accounts/page.tsx (hapus edit sheet, AccountCard → Link)
7. Task 6 — type check

## CLAUDE.md Check
- [ ] Route baru: `src/app/(app)/accounts/[id]/page.tsx` — dynamic route by account ID
- [ ] Pattern baru: `use(params)` untuk dynamic route params di React 19 (bukan `await params` atau destructure langsung)
- [ ] Pattern baru: `AccountBottomSheet` di-reuse dari halaman list ke halaman detail
- [ ] Tidak ada tabel DB baru
- [ ] Tidak ada permission pattern baru
