# Plan: Wishlist Feature (bf-wsl)

**Date:** 2026-07-22
**Issue:** bf-wsl · P2 Feature
**Route:** `/wishlist`
**Scope:** Wishlist items list + affordability check + CRUD

---

## Context

Schema `wishlists`:
```
id, user_id, name, description, url, image_url,
estimated_price (numeric), priority (smallint 1-5, default 3),
status (text: "active"|"purchased"|"cancelled", default "active"),
linked_goal_id (FK savings_goals, nullable),
target_date (date), purchased_at (timestamp), purchased_price (numeric),
created_at, updated_at
```

Affordability check v1: bandingkan `estimated_price` dengan total liquid balance (akun `asset_category = "liquid"`).

`wishlistKeys` sudah ada: `wishlistKeys.all / .list(status?) / .detail(id)`

---

## Files

```
src/db/queries/wishlist.ts                              ← NEW
src/lib/schemas/wishlist.ts                             ← NEW
src/app/(app)/wishlist/actions.ts                       ← NEW
src/app/(app)/wishlist/_hooks/useWishlist.ts            ← NEW
src/app/(app)/wishlist/_components/WishlistCard.tsx     ← NEW
src/app/(app)/wishlist/_components/WishlistBottomSheet.tsx ← NEW
src/app/(app)/wishlist/page.tsx                         ← REPLACE stub
```

---

## Task 1 — Query (`src/db/queries/wishlist.ts`)

```ts
import { and, eq, isNull, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { wishlists } from "@/db/schema";

export interface WishlistRow {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  estimated_price: number;
  priority: number;
  status: string;
  target_date: string | null;
  linked_goal_id: string | null;
}

export async function getWishlistItems(
  userId: string,
  status: "active" | "purchased" | "cancelled" = "active"
): Promise<WishlistRow[]> {
  return db
    .select({
      id: wishlists.id,
      name: wishlists.name,
      description: wishlists.description,
      url: wishlists.url,
      estimated_price: sql<number>`${wishlists.estimated_price}::numeric`,
      priority: wishlists.priority,
      status: wishlists.status,
      target_date: wishlists.target_date,
      linked_goal_id: wishlists.linked_goal_id,
    })
    .from(wishlists)
    .where(and(eq(wishlists.user_id, userId), eq(wishlists.status, status)))
    .orderBy(wishlists.priority, desc(wishlists.created_at));
}

export async function createWishlistItem(
  userId: string,
  input: {
    name: string;
    description?: string | null;
    url?: string | null;
    estimated_price: number;
    priority?: number;
    target_date?: string | null;
  }
): Promise<string> {
  const result = await db
    .insert(wishlists)
    .values({
      user_id: userId,
      name: input.name,
      description: input.description ?? null,
      url: input.url ?? null,
      estimated_price: String(input.estimated_price),
      priority: input.priority ?? 3,
      target_date: input.target_date ?? null,
    })
    .returning({ id: wishlists.id });
  return result[0].id;
}

export async function updateWishlistItem(
  userId: string,
  itemId: string,
  input: Partial<{
    name: string;
    description: string | null;
    url: string | null;
    estimated_price: number;
    priority: number;
    status: string;
    target_date: string | null;
  }>
): Promise<void> {
  const set: Record<string, unknown> = { updated_at: sql`now()` };
  if (input.name !== undefined) set.name = input.name;
  if (input.description !== undefined) set.description = input.description;
  if (input.url !== undefined) set.url = input.url;
  if (input.estimated_price !== undefined) set.estimated_price = String(input.estimated_price);
  if (input.priority !== undefined) set.priority = input.priority;
  if (input.status !== undefined) set.status = input.status;
  if (input.target_date !== undefined) set.target_date = input.target_date;

  await db
    .update(wishlists)
    .set(set)
    .where(and(eq(wishlists.id, itemId), eq(wishlists.user_id, userId)));
}

export async function deleteWishlistItem(userId: string, itemId: string): Promise<void> {
  await db
    .delete(wishlists)
    .where(and(eq(wishlists.id, itemId), eq(wishlists.user_id, userId)));
}
```

---

## Task 2 — Zod Schema (`src/lib/schemas/wishlist.ts`)

```ts
import { z } from "zod";

export const createWishlistSchema = z.object({
  name: z.string().min(1, "Nama item wajib diisi").max(100),
  description: z.string().max(200).optional().nullable(),
  url: z.string().url("URL tidak valid").optional().nullable().or(z.literal("")),
  estimated_price: z.number().positive("Harga harus lebih dari 0"),
  priority: z.number().int().min(1).max(5).optional().default(3),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export const updateWishlistSchema = createWishlistSchema.partial().extend({
  status: z.enum(["active", "purchased", "cancelled"]).optional(),
});

export type CreateWishlistInput = z.infer<typeof createWishlistSchema>;
export type UpdateWishlistInput = z.infer<typeof updateWishlistSchema>;
```

---

## Task 3 — Server Actions (`src/app/(app)/wishlist/actions.ts`)

- `getWishlistAction(status?)` → list items
- `getAffordabilityAction()` → total liquid balance dari accounts (reuse `getAccountsWithType`, filter `asset_category === "liquid"`)
- `createWishlistAction(input)` → zod parse → create
- `updateWishlistAction(id, input)` → UUID + zod → update
- `deleteWishlistAction(id)` → UUID → delete

---

## Task 4 — Hook (`src/app/(app)/wishlist/_hooks/useWishlist.ts`)

```ts
useWishlist() → {
  query,           // active wishlist items
  affordability,   // total liquid balance
  createMutation,
  updateMutation,
  deleteMutation,
}
```

---

## Task 5 — WishlistCard (`src/app/(app)/wishlist/_components/WishlistCard.tsx`)

Display: nama, harga, priority badge (1=🔴 urgent → 5=🟢 someday), affordability indicator (bisa beli sekarang? liquid balance vs price).

Priority label: 1→"Urgent", 2→"High", 3→"Normal", 4→"Low", 5→"Someday".

Affordability: jika `liquidBalance >= estimated_price` → badge hijau "Bisa beli"; jika kurang → badge merah + shortfall amount.

Tap → onEdit(item).

---

## Task 6 — WishlistBottomSheet (`src/app/(app)/wishlist/_components/WishlistBottomSheet.tsx`)

Fields:
- Nama (Input)
- Harga Estimasi (Input number)
- Prioritas (SingleSelect 1-5)
- URL (Input, optional)
- Target Tanggal (Input date, optional)
- Catatan/Deskripsi (Input, optional)

Edit mode: tambah status toggle (active/purchased/cancelled) + Delete button.

---

## Task 7 — Page (`src/app/(app)/wishlist/page.tsx`)

- Header gradient + wave
- Affordability summary card: liquid balance, "dapat beli X item"
- Tab filter: Active / Purchased / Cancelled (state toggle)
- List WishlistCard
- FAB → create
- Empty state per tab

---

## Verifikasi

1. List active items render
2. Affordability card hitung benar (liquid balance vs harga terkecil/terbesar)
3. Create item → muncul di list
4. Edit status → purchased → pindah ke tab Purchased
5. Delete → hilang
6. `hideBalances` → harga sensor

## CLAUDE.md Check
- [ ] Pattern sama dengan budgets/goals — tidak ada yang baru
