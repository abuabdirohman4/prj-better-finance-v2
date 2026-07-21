# Plan: Accounts CRUD — Create, Edit, Delete via Bottom Sheet

## Context

Better Finance v2 — accounts list page sudah read-only (bf-uy0 selesai). Sekarang tambah CRUD:
- **Create** akun baru (nama, tipe, saldo awal, urutan)
- **Edit** akun (nama, saldo, urutan, include_in_net_worth)
- **Delete** akun (soft-delete via `is_active = false`)

UI: **bottom sheet** (slide up dari bawah) — mobile-first, konsisten dengan v1. Bukan modal popup.
Trigger create: tombol FAB "+" di pojok kanan bawah halaman accounts.
Trigger edit/delete: tap pada AccountCard (yang sekarang non-clickable).

## Files Terdampak

```
src/db/queries/accounts.ts            — tambah createAccount, updateAccount, deactivateAccount
src/app/(app)/accounts/actions.ts     — tambah 3 Server Actions: createAccount, updateAccount, deleteAccount
src/app/(app)/accounts/_components/
  AccountCard.tsx                     — tambah onClick → open edit sheet
  AccountBottomSheet.tsx              — NEW: form create/edit + konfirmasi delete
src/app/(app)/accounts/page.tsx       — tambah FAB + state bottomSheet + invalidate query on success
src/lib/accountVisuals.ts             — (no change — sudah cukup)
```

## Schema Reference (dari src/db/schema.ts)

```ts
accounts {
  id, user_id, account_type_id, name, slug, description,
  current_balance, last_reality_check, last_reality_check_at,
  asset_category, icon_name, color_hex,
  is_active, include_in_net_worth, is_wallet, sort_order,
  created_at, updated_at
}
accountTypes { id, user_id, name, slug, ... }
```

Unique constraint: `(user_id, slug)` — slug di-generate dari nama (lowercase, spasi→-).

## Task 0 — Tambah query mutations di `src/db/queries/accounts.ts`

### 0a. getAccountTypes(userId)
```ts
export async function getAccountTypes(userId: string): Promise<{ id: string; name: string; slug: string }[]> {
  return db
    .select({ id: accountTypes.id, name: accountTypes.name, slug: accountTypes.slug })
    .from(accountTypes)
    .where(eq(accountTypes.user_id, userId))
    .orderBy(accountTypes.sort_order);
}
```

### 0b. createAccount(userId, input)
```ts
export interface CreateAccountInput {
  name: string;
  account_type_id: string;
  current_balance: number;
  include_in_net_worth: boolean;
  sort_order: number;
}

export async function createAccount(userId: string, input: CreateAccountInput): Promise<string> {
  const slug = input.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const [row] = await db
    .insert(accounts)
    .values({
      user_id: userId,
      account_type_id: input.account_type_id,
      name: input.name,
      slug,
      current_balance: String(input.current_balance),
      include_in_net_worth: input.include_in_net_worth,
      sort_order: input.sort_order,
    })
    .returning({ id: accounts.id });
  return row.id;
}
```

### 0c. updateAccount(userId, accountId, input)
```ts
export interface UpdateAccountInput {
  name?: string;
  current_balance?: number;
  include_in_net_worth?: boolean;
  sort_order?: number;
}

export async function updateAccount(
  userId: string,
  accountId: string,
  input: UpdateAccountInput
): Promise<void> {
  const values: Record<string, unknown> = {
    updated_at: new Date(),
  };
  if (input.name !== undefined) {
    values.name = input.name;
    values.slug = input.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }
  if (input.current_balance !== undefined) values.current_balance = String(input.current_balance);
  if (input.include_in_net_worth !== undefined) values.include_in_net_worth = input.include_in_net_worth;
  if (input.sort_order !== undefined) values.sort_order = input.sort_order;

  await db
    .update(accounts)
    .set(values)
    .where(and(eq(accounts.id, accountId), eq(accounts.user_id, userId)));
}
```

### 0d. deactivateAccount(userId, accountId)
```ts
export async function deactivateAccount(userId: string, accountId: string): Promise<void> {
  await db
    .update(accounts)
    .set({ is_active: false, updated_at: new Date() })
    .where(and(eq(accounts.id, accountId), eq(accounts.user_id, userId)));
}
```

## Task 1 — Server Actions di `src/app/(app)/accounts/actions.ts`

Tambah 4 actions baru (getAccountTypes + create + update + delete). File sudah ada, append saja.

```ts
// getAccountTypes
export async function getAccountTypesAction(): Promise<ServerActionResult<{ id: string; name: string; slug: string }[]>> {
  try {
    const user = await requireUser();
    const data = await getAccountTypes(user.id);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}

// createAccount
export async function createAccountAction(
  input: CreateAccountInput
): Promise<ServerActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const id = await createAccount(user.id, input);
    return { success: true, data: { id } };
  } catch (error) {
    return { success: false, message: handleApiError(error, "menyimpan data").message };
  }
}

// updateAccount
export async function updateAccountAction(
  accountId: string,
  input: UpdateAccountInput
): Promise<ServerActionResult<void>> {
  try {
    const user = await requireUser();
    await updateAccount(user.id, accountId, input);
    return { success: true };
  } catch (error) {
    return { success: false, message: handleApiError(error, "mengupdate data").message };
  }
}

// deleteAccount (soft-delete)
export async function deleteAccountAction(
  accountId: string
): Promise<ServerActionResult<void>> {
  try {
    const user = await requireUser();
    await deactivateAccount(user.id, accountId);
    return { success: true };
  } catch (error) {
    return { success: false, message: handleApiError(error, "menghapus data").message };
  }
}
```

## Task 2 — `AccountBottomSheet.tsx` (NEW)

File: `src/app/(app)/accounts/_components/AccountBottomSheet.tsx`

Props:
```ts
interface AccountBottomSheetProps {
  mode: "create" | "edit";
  account?: AccountRow;           // hanya saat mode="edit"
  accountTypes: { id: string; name: string; slug: string }[];
  onClose: () => void;
  onSuccess: () => void;          // trigger invalidate query di parent
}
```

UI:
- Overlay gelap `fixed inset-0 bg-black/40 z-40` — tap untuk tutup
- Sheet `fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6`
- Animasi: `translate-y-0` (open) / `translate-y-full` (closed) dengan `transition-transform duration-300`
- Header: judul ("Tambah Akun" / "Edit Akun") + tombol X
- Form fields:
  - **Nama** — `<input type="text">` required, max 50 chars
  - **Tipe Akun** — `<select>` dari accountTypes prop (hanya saat create — edit tidak ubah tipe)
  - **Saldo Awal** — `<input type="number">` min=0, placeholder "0"
  - **Include in Net Worth** — `<input type="checkbox">`
  - **Urutan** — `<input type="number">` min=1 (opsional, default = jumlah akun + 1)
- Submit button: "Simpan" dengan loading state (`isPending`)
- **Delete button** (hanya mode edit): tombol merah "Hapus Akun" → konfirmasi inline ("Yakin hapus? [Batal] [Hapus]")
- Error display: `<p className="text-red-600 text-sm">{error}</p>`

State management: `useState` lokal di dalam sheet (nama, tipe, saldo, dll). Submit via `useTransition` / `useState(isPending)`.

```ts
"use client";
import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { createAccountAction, updateAccountAction, deleteAccountAction } from "../actions";
import type { AccountRow } from "@/db/queries/accounts";

// ... lihat implementasi lengkap di Task 2 implementasi
```

## Task 3 — Update `AccountCard.tsx`

Tambah `onClick` prop:
```ts
export function AccountCard({
  account,
  onClick,
}: {
  account: AccountRow;
  onClick?: () => void;
}) {
  // ...
  return (
    <div
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden cursor-pointer active:scale-95 transition-transform"
      onClick={onClick}
    >
      {/* ... existing content unchanged ... */}
    </div>
  );
}
```

## Task 4 — Update `accounts/page.tsx`

State tambahan:
```ts
const [sheet, setSheet] = useState<{ mode: "create" | "edit"; account?: AccountRow } | null>(null);
const { data: accountTypes } = useQuery({
  queryKey: ["account-types"],
  queryFn: async () => {
    const res = await getAccountTypesAction();
    if (!res.success) throw new Error(res.message);
    return res.data!;
  },
});
const queryClient = useQueryClient();
const handleSuccess = () => {
  setSheet(null);
  queryClient.invalidateQueries({ queryKey: accountKeys.list() });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
};
```

FAB tombol (+) di pojok kanan bawah (di luar scroll area, `fixed`):
```tsx
<button
  onClick={() => setSheet({ mode: "create" })}
  className="fixed bottom-24 right-4 z-30 w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow"
  aria-label="Tambah akun"
>
  <Plus className="w-6 h-6" />
</button>
```

AccountCard tiap item: tambah `onClick={() => setSheet({ mode: "edit", account: a })}`.

Bottom sheet render di bawah:
```tsx
{sheet && (
  <AccountBottomSheet
    mode={sheet.mode}
    account={sheet.account}
    accountTypes={accountTypes ?? []}
    onClose={() => setSheet(null)}
    onSuccess={handleSuccess}
  />
)}
```

## Task 5 — Type check

```bash
npm run type-check
# Expected: exit 0, no errors
```

## Urutan Eksekusi

1. Task 0 — query layer (db/queries/accounts.ts)
2. Task 1 — Server Actions (accounts/actions.ts)
3. Task 2 — AccountBottomSheet component (NEW file)
4. Task 3 — AccountCard onClick prop
5. Task 4 — accounts/page.tsx (FAB + sheet state + useQueryClient)
6. Task 5 — type-check

## CLAUDE.md Check
- [ ] Pattern baru? Ya — bottom sheet component pattern. Tidak perlu di AGENTS.md (cukup jelas dari kode).
- [ ] Tabel DB baru? Tidak.
- [ ] Route baru? Tidak.
- [ ] Permission pattern baru? Tidak (pakai requireUser yang sudah ada).
- [ ] `useQueryClient().invalidateQueries()` pattern baru untuk cache invalidation — sudah ada di query.ts.
