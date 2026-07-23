import { and, eq, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { wishlists, savingsGoals } from "@/db/schema";

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
  const rows = await db
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

  return rows.map(r => ({ ...r, estimated_price: Number(r.estimated_price) }));
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

// Task 8a — Promote wishlist → goal
export async function promoteWishlistToGoal(
  userId: string,
  wishlistId: string,
  linkedAccountId: string | null,
): Promise<string> {
  // 1. fetch wishlist (guard user_id)
  const [w] = await db.select().from(wishlists)
    .where(and(eq(wishlists.id, wishlistId), eq(wishlists.user_id, userId)));
  if (!w) throw new Error("Wishlist not found");
  if (w.linked_goal_id) throw new Error("Wishlist is already a goal");

  // 2. create goal (goal_type 'Saving', target = estimated_price)
  const [g] = await db.insert(savingsGoals).values({
    user_id: userId,
    name: w.name,
    goal_type: "Saving",
    target_amount: String(w.estimated_price),
    linked_account_id: linkedAccountId,
    deadline_date: w.target_date,
  }).returning({ id: savingsGoals.id });

  // 3. link back
  await db.update(wishlists)
    .set({ linked_goal_id: g.id, updated_at: sql`now()` })
    .where(and(eq(wishlists.id, wishlistId), eq(wishlists.user_id, userId)));

  return g.id;
}
