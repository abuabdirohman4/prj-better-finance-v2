# Category Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** User bisa create/edit/hapus (soft) kategori dari halaman baru `/budgets/categories`.

**Architecture:** Halaman full-page baru di bawah `/budgets`. Tabel `categories` sudah lengkap (zero migration). Soft delete via `is_active=false` (transaksi/budget lama utuh). Grup free-text (pilih existing atau ketik baru). Data layer baru `categories.ts` + 3 server action di `budgets/actions.ts` + CategoryBottomSheet form. Picker refresh via invalidate `categoryKeys`.

**Tech Stack:** Next.js (client pages + server actions), Drizzle ORM, TanStack Query, zod, Tailwind v4, vitest.

**Issue:** bf-wrp · **Design:** `docs/plans/2026-07-24-bf-wrp-category-management-design.md`

---

## Referensi Pola (baca sebelum mulai)

- Server action pattern: `src/app/(app)/budgets/actions.ts:15-46` (`requireUser` → zod safeParse → query → `handleApiError` → `ServerActionResult`).
- Query filter pattern: `src/db/queries/accounts.ts:288-300` (`getCategories`, WAJIB `where(eq(categories.user_id, userId))`).
- Bottom sheet pattern: `src/app/(app)/budgets/_components/BudgetBottomSheet.tsx` (visible/transform animation, Escape close, SingleSelect, delete confirm).
- Page pattern: `src/app/(app)/budgets/page.tsx` (header gradient+wave, TanStack hook, Fab).
- Query keys: `src/lib/query.ts:56-59` (`categoryKeys`).
- Test pattern: `src/app/(app)/transactions/__tests__/balanceMath.test.ts` (pure fn di `_lib/`, test di `__tests__/`, vitest `describe/it/expect`).
- Schema `categories`: `src/db/schema.ts:104-124`. Kolom: `name`, `slug`, `group_name` (text/free), `sort_order`, `is_system`, `is_active`. Unique `(user_id, slug, group_name)`.
- Constants: `src/lib/constants.ts:20-36` (`CategoryGroup` type + `CATEGORY_GROUP_LABELS`).

**Aturan wajib project:**
- Semua wording UI **English**.
- Server Action return `ServerActionResult<T>`, wrap `handleApiError(e, "context")`.
- Validasi WAJIB di server (form bisa di-bypass).
- Query WAJIB filter `user_id`.

---

## Task 1: Slug utility (pure fn + test)

**Files:**
- Create: `src/lib/slug.ts`
- Test: `src/lib/__tests__/slug.test.ts`

**Step 1: Write failing test**

```typescript
// src/lib/__tests__/slug.test.ts
import { describe, it, expect } from "vitest";
import { toSlug } from "../slug";

describe("toSlug", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(toSlug("Dining Out")).toBe("dining-out");
  });
  it("strips non-alphanumeric, collapses hyphens", () => {
    expect(toSlug("  Food & Drinks!! ")).toBe("food-drinks");
  });
  it("handles already-slug", () => {
    expect(toSlug("transport")).toBe("transport");
  });
  it("empty-ish returns empty string", () => {
    expect(toSlug("  ")).toBe("");
  });
});
```

**Step 2: Run — verify FAIL**

Run: `npm run test:run -- slug`
Expected: FAIL — cannot find module `../slug`.

**Step 3: Implement**

```typescript
// src/lib/slug.ts
/** Nama kategori → slug kebab-case (a-z0-9, hyphen). */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

**Step 4: Run — verify PASS**

Run: `npm run test:run -- slug`
Expected: PASS (4 tests).

**Step 5: Commit**

```bash
git add src/lib/slug.ts src/lib/__tests__/slug.test.ts
git commit -m "feat(shared): add toSlug utility for category slugs"
```

---

## Task 2: zod schema

**Files:**
- Create: `src/lib/schemas/category.ts`

**Step 1: Implement** (schema-only, no test — trivial, covered by action tests)

```typescript
// src/lib/schemas/category.ts
import { z } from "zod";

export const upsertCategorySchema = z.object({
  id: z.string().uuid().optional(), // absent = create, present = update
  name: z.string().trim().min(1, "Category name is required").max(60),
  group_name: z.string().trim().min(1, "Group is required").max(40),
});

export type UpsertCategoryInput = z.infer<typeof upsertCategorySchema>;
```

**Step 2: Commit**

```bash
git add src/lib/schemas/category.ts
git commit -m "feat(schemas): add upsertCategorySchema"
```

---

## Task 3: Data layer — categories queries

**Files:**
- Create: `src/db/queries/categories.ts`

**Step 1: Implement**

```typescript
// src/db/queries/categories.ts
import { and, eq, max } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { toSlug } from "@/lib/slug";

export interface ManageCategoryRow {
  id: string;
  name: string;
  slug: string;
  group_name: string;
}

/** Semua kategori aktif user (buat halaman manage). Urut group lalu sort_order. */
export async function getManageCategories(userId: string): Promise<ManageCategoryRow[]> {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      group_name: categories.group_name,
    })
    .from(categories)
    .where(and(eq(categories.user_id, userId), eq(categories.is_active, true)))
    .orderBy(categories.group_name, categories.sort_order);
}

export async function createCategory(
  userId: string,
  input: { name: string; group_name: string }
): Promise<{ id: string }> {
  const [{ maxOrder }] = await db
    .select({ maxOrder: max(categories.sort_order) })
    .from(categories)
    .where(eq(categories.user_id, userId));

  const [row] = await db
    .insert(categories)
    .values({
      user_id: userId,
      name: input.name,
      slug: toSlug(input.name),
      group_name: input.group_name,
      sort_order: (maxOrder ?? 0) + 1,
      is_system: false,
      is_active: true,
    })
    .returning({ id: categories.id });
  return row;
}

export async function updateCategory(
  userId: string,
  id: string,
  input: { name: string; group_name: string }
): Promise<void> {
  await db
    .update(categories)
    .set({ name: input.name, slug: toSlug(input.name), group_name: input.group_name })
    .where(and(eq(categories.id, id), eq(categories.user_id, userId)));
}

/** Soft delete — transaksi/budget lama tetap utuh. */
export async function softDeleteCategory(userId: string, id: string): Promise<void> {
  await db
    .update(categories)
    .set({ is_active: false })
    .where(and(eq(categories.id, id), eq(categories.user_id, userId)));
}
```

**Step 2: Verify import path `db`**

Run: `rtk proxy grep -n "export.*db" src/db/index.ts`
Expected: `db` exported. Kalau path beda, sesuaikan import (lihat cara `accounts.ts` import `db`).

**Step 3: Commit**

```bash
git add src/db/queries/categories.ts
git commit -m "feat(db): category CRUD queries (soft delete)"
```

---

## Task 4: Server actions

**Files:**
- Modify: `src/app/(app)/budgets/actions.ts` (tambah di akhir file)

**Step 1: Implement** (tambah import + 4 action)

Tambah import di atas:
```typescript
import {
  getManageCategories,
  createCategory,
  updateCategory,
  softDeleteCategory,
  type ManageCategoryRow,
} from "@/db/queries/categories";
import { upsertCategorySchema, type UpsertCategoryInput } from "@/lib/schemas/category";
```

Tambah action di akhir file:
```typescript
export async function getManageCategoriesAction(): Promise<ServerActionResult<ManageCategoryRow[]>> {
  try {
    const user = await requireUser();
    const data = await getManageCategories(user.id);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat kategori").message };
  }
}

export async function upsertCategoryAction(
  input: UpsertCategoryInput
): Promise<ServerActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = upsertCategorySchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { id, name, group_name } = parsed.data;
    if (id) {
      await updateCategory(user.id, id, { name, group_name });
      return { success: true, data: { id } };
    }
    const created = await createCategory(user.id, { name, group_name });
    return { success: true, data: created };
  } catch (error) {
    return { success: false, message: handleApiError(error, "menyimpan kategori").message };
  }
}

export async function deleteCategoryAction(id: string): Promise<ServerActionResult<void>> {
  try {
    const user = await requireUser();
    await softDeleteCategory(user.id, id);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, message: handleApiError(error, "menghapus kategori").message };
  }
}
```

**Step 2: Commit**

```bash
git add "src/app/(app)/budgets/actions.ts"
git commit -m "feat(budgets): category management server actions"
```

---

## Task 5: Query keys + hook

**Files:**
- Modify: `src/lib/query.ts` (tambah key kalau perlu)
- Create: `src/app/(app)/budgets/categories/_hooks/useManageCategories.ts`

**Step 1: Cek query.ts** — `categoryKeys.list()` sudah ada (`src/lib/query.ts:58`). Tambah `manage`:

```typescript
// di categoryKeys object
  manage: () => [...categoryKeys.all, "manage"] as const,
```

**Step 2: Implement hook**

```typescript
// src/app/(app)/budgets/categories/_hooks/useManageCategories.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoryKeys } from "@/lib/query";
import {
  getManageCategoriesAction,
  upsertCategoryAction,
  deleteCategoryAction,
} from "../../actions";
import type { UpsertCategoryInput } from "@/lib/schemas/category";

export function useManageCategories() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: categoryKeys.manage(),
    queryFn: async () => {
      const res = await getManageCategoriesAction();
      if (!res.success) throw new Error(res.message ?? "Failed to load categories");
      return res.data!;
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: categoryKeys.all });
  };

  const upsertMutation = useMutation({
    mutationFn: (input: UpsertCategoryInput) => upsertCategoryAction(input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategoryAction(id),
    onSuccess: invalidate,
  });

  return { query, upsertMutation, deleteMutation };
}
```

**Step 3: Commit**

```bash
git add src/lib/query.ts "src/app/(app)/budgets/categories/_hooks/useManageCategories.ts"
git commit -m "feat(budgets): useManageCategories hook + query key"
```

---

## Task 6: CategoryBottomSheet

**Files:**
- Create: `src/app/(app)/budgets/categories/_components/CategoryBottomSheet.tsx`

**Step 1: Implement** (pola dari `BudgetBottomSheet.tsx` — visible/transform, Escape, delete confirm)

```tsx
// src/app/(app)/budgets/categories/_components/CategoryBottomSheet.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Trash2 } from "lucide-react";
import { SingleSelect } from "@/components/ui/MultiSelect";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CATEGORY_GROUP_LABELS } from "@/lib/constants";
import type { ManageCategoryRow } from "@/db/queries/categories";
import type { UseMutationResult } from "@tanstack/react-query";
import type { UpsertCategoryInput } from "@/lib/schemas/category";
import type { ServerActionResult } from "@/lib/errorUtils";

const NEW_GROUP = "__new__";

interface Props {
  open: boolean;
  onClose: () => void;
  editCategory?: ManageCategoryRow | null;
  existingGroups: string[];
  onSuccess: () => void;
  upsertMutation: UseMutationResult<ServerActionResult<{ id: string }>, Error, UpsertCategoryInput, unknown>;
  deleteMutation: UseMutationResult<ServerActionResult<void>, Error, string, unknown>;
}

export function CategoryBottomSheet({
  open, onClose, editCategory, existingGroups, onSuccess, upsertMutation, deleteMutation,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [groupSel, setGroupSel] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(editCategory);

  useEffect(() => {
    if (open) {
      setName(editCategory?.name ?? "");
      setGroupSel(editCategory?.group_name ?? "");
      setNewGroup("");
      setError(null);
      requestAnimationFrame(() => setVisible(true));
    }
  }, [open, editCategory]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setError(null);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  // Group options: known labels + any existing custom groups + "New group"
  const knownGroups = Object.keys(CATEGORY_GROUP_LABELS);
  const allGroups = Array.from(new Set([...knownGroups, ...existingGroups]));
  const groupOptions = [
    ...allGroups.map((g) => ({ value: g, label: CATEGORY_GROUP_LABELS[g as keyof typeof CATEGORY_GROUP_LABELS] ?? g })),
    { value: NEW_GROUP, label: "+ New group" },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const finalGroup = groupSel === NEW_GROUP ? newGroup.trim() : groupSel;
    if (!name.trim()) { setError("Category name is required."); return; }
    if (!finalGroup) { setError("Group is required."); return; }

    upsertMutation.mutate(
      { id: editCategory?.id, name: name.trim(), group_name: finalGroup },
      {
        onSuccess: (res) => {
          if (!res.success) { setError(res.message ?? "Something went wrong."); return; }
          onSuccess();
          handleClose();
        },
      }
    );
  }

  function handleDelete() {
    if (!editCategory) return;
    if (!confirm(`Delete "${editCategory.name}"? Past transactions keep this label.`)) return;
    setError(null);
    deleteMutation.mutate(editCategory.id, {
      onSuccess: (res) => {
        if (!res.success) { setError(res.message ?? "Something went wrong."); return; }
        onSuccess();
        handleClose();
      },
    });
  }

  if (!open && !visible) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }} onClick={handleClose} />
      <div className="fixed bottom-0 left-1/2 w-full max-w-md bg-white rounded-t-3xl z-50 shadow-2xl transition-transform duration-300 max-h-[90vh] overflow-y-auto"
        style={{ transform: visible ? "translate(-50%, 0)" : "translate(-50%, 100%)" }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? "Edit Category" : "Add Category"}</h2>
            <div className="flex items-center gap-2">
              {isEdit && (
                <button type="button" onClick={handleDelete}
                  disabled={deleteMutation.isPending || upsertMutation.isPending}
                  className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors disabled:opacity-40">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button type="button" onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 mb-4 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Category Name" type="text" value={name}
              onChange={(e) => setName(e.target.value)} placeholder="e.g. Coffee"
              disabled={upsertMutation.isPending} required />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
              <SingleSelect options={groupOptions} value={groupSel} onChange={setGroupSel}
                placeholder="Select Group" searchable direction="up" disabled={upsertMutation.isPending} />
            </div>

            {groupSel === NEW_GROUP && (
              <Input label="New Group Name" type="text" value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)} placeholder="e.g. Travel"
                disabled={upsertMutation.isPending} />
            )}

            <Button type="submit" className="w-full mt-2"
              disabled={upsertMutation.isPending || deleteMutation.isPending}>
              {upsertMutation.isPending ? "Saving..." : "Save Category"}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
```

**Step 2: Verify `Input`/`Button`/`SingleSelect` props** — sama seperti dipakai `BudgetBottomSheet.tsx`. Kalau typecheck error, samakan.

**Step 3: Commit**

```bash
git add "src/app/(app)/budgets/categories/_components/CategoryBottomSheet.tsx"
git commit -m "feat(budgets): CategoryBottomSheet add/edit form"
```

---

## Task 7: Manage Categories page

**Files:**
- Create: `src/app/(app)/budgets/categories/page.tsx`

**Step 1: Implement** (Page Pattern — header gradient+wave copy dari budgets, list per grup, Fab)

```tsx
// src/app/(app)/budgets/categories/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { useManageCategories } from "./_hooks/useManageCategories";
import { CategoryBottomSheet } from "./_components/CategoryBottomSheet";
import { Fab } from "@/components/layouts/Fab";
import { CATEGORY_GROUP_LABELS } from "@/lib/constants";
import type { ManageCategoryRow } from "@/db/queries/categories";

export default function ManageCategoriesPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<ManageCategoryRow | null>(null);
  const { query, upsertMutation, deleteMutation } = useManageCategories();

  const categories = query.data ?? [];

  const groups = categories.reduce<Record<string, ManageCategoryRow[]>>((acc, c) => {
    const g = c.group_name || "others";
    (acc[g] ??= []).push(c);
    return acc;
  }, {});

  const existingGroups = Object.keys(groups);

  function openCreate() { setEditCategory(null); setSheetOpen(true); }
  function openEdit(c: ManageCategoryRow) { setEditCategory(c); setSheetOpen(true); }

  return (
    <div className="bg-blue-50 min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden bg-linear-to-r from-blue-600 via-blue-700 to-indigo-800 px-4 pt-5 pb-6">
        <div className="absolute bottom-0 left-0 w-full h-8">
          <svg viewBox="0 0 400 32" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,32 Q100,20 200,32 T400,20 L400,32 Z" fill="rgb(239 246 255)" />
          </svg>
        </div>
        <div className="relative z-10 flex items-center">
          <Link href="/budgets" className="p-2 rounded-full hover:bg-white/20 transition-colors" aria-label="Back">
            <ChevronLeft className="w-7 h-7 text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">Manage Categories</h1>
            <p className="text-blue-100 text-sm">Add, edit, or remove categories</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 pb-24 space-y-6">
        {query.isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="animate-pulse bg-white rounded-2xl h-16 shadow-sm" />)}
          </div>
        )}

        {!query.isLoading && categories.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <p className="text-gray-400 text-sm">No categories yet.</p>
            <p className="text-gray-400 text-xs mt-1">Tap + to add one.</p>
          </div>
        )}

        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <h3 className="font-bold text-gray-900 capitalize text-base mb-2">
              {CATEGORY_GROUP_LABELS[group as keyof typeof CATEGORY_GROUP_LABELS] ?? group}
            </h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
              {items.map((c) => (
                <button key={c.id} onClick={() => openEdit(c)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                  <span className="text-gray-800">{c.name}</span>
                  <Pencil className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Fab onClick={openCreate} label="Add category" />

      <CategoryBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        editCategory={editCategory}
        existingGroups={existingGroups}
        onSuccess={() => setSheetOpen(false)}
        upsertMutation={upsertMutation}
        deleteMutation={deleteMutation}
      />
    </div>
  );
}
```

**Step 2: Verify `Fab` props** — cek `src/components/layouts/Fab.tsx` (dipakai di budgets page: `onClick` + `label`). Samakan.

**Step 3: Commit**

```bash
git add "src/app/(app)/budgets/categories/page.tsx"
git commit -m "feat(budgets): manage categories page"
```

---

## Task 8: Entry point di /budgets

**Files:**
- Modify: `src/app/(app)/budgets/page.tsx`

**Step 1: Tambah tombol "Manage Categories"**

Cari blok judul "Budget Spending" (`src/app/(app)/budgets/page.tsx`, sekitar `budgets.length > 0` render `<h2>Budget Spending</h2>`). Ganti jadi baris dengan tombol di kanan:

```tsx
{!query.isLoading && (
  <div className="flex items-center justify-between">
    <h2 className="font-bold text-gray-900 text-lg">Budget Spending</h2>
    <Link href="/budgets/categories" className="text-sm font-medium text-blue-600 hover:text-blue-700">
      Manage Categories
    </Link>
  </div>
)}
```

(`Link` sudah di-import di file ini.) Hapus `<h2>` lama yang berdiri sendiri kalau jadi duplikat.

**Step 2: Commit**

```bash
git add "src/app/(app)/budgets/page.tsx"
git commit -m "feat(budgets): link to manage categories page"
```

---

## Task 9: Build + verifikasi + docs

**Step 1: Build** (WAJIB lolos — catch typo query/import)

Run: `npm run build`
Expected: build sukses, no type error.
> Claude: minta user jalankan, analisa hasil.

**Step 2: Manual smoke test** (user)
- `/budgets` → tap "Manage Categories" → halaman muncul, list per grup.
- Tap + → add "Coffee" grup "eating" → save → muncul di list + di picker budget/transaksi.
- Tap kategori → edit nama → save → transaksi lama pakai kategori itu ikut nama baru.
- Tap kategori → 🗑 → confirm → hilang dari list + picker; transaksi lama tetap tampil nama lama.
- Add kategori grup baru "Travel" → muncul group baru di `/budgets`.

**Step 3: Update docs**
- `AGENTS.md` "Feature Pages": tambah note `/budgets/categories`.
- `AGENTS.md`: catat `getManageCategories` (grouped, buat manage) vs `getCategories` (flat, picker); soft delete pattern (`is_active=false`).
- `docs/roadmap.md`: bf-wrp done.
- `README.md`: fitur manage categories (kalau ada bagian fitur user-facing).

**Step 4: Commit docs**

```bash
git add AGENTS.md docs/roadmap.md README.md
git commit -m "docs: category management (bf-wrp)"
```

**Step 5: Close issue**

```bash
bd close bf-wrp
```

---

## CLAUDE.md Check
- [x] Route baru `/budgets/categories` → AGENTS.md Feature Pages (Task 9).
- [x] Pattern soft delete + grup free-text → AGENTS.md (Task 9).
- [x] `getManageCategories` vs `getCategories` → AGENTS.md (Task 9).
- [ ] Tabel DB baru: TIDAK (zero migration).
