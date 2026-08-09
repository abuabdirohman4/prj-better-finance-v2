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

/** Rename sebuah grup untuk semua kategori milik user (mass update). */
export async function renameCategoryGroup(
  userId: string,
  oldGroupName: string,
  newGroupName: string
): Promise<void> {
  await db
    .update(categories)
    .set({ group_name: newGroupName })
    .where(and(eq(categories.user_id, userId), eq(categories.group_name, oldGroupName)));
}
