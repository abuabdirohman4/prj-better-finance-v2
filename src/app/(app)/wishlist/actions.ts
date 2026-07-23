"use server";
import { z } from "zod";
import { requireUser } from "@/lib/accessControlServer";
import { handleApiError, type ServerActionResult } from "@/lib/errorUtils";
import {
  getWishlistItems,
  createWishlistItem,
  updateWishlistItem,
  deleteWishlistItem,
  promoteWishlistToGoal,
  type WishlistRow,
} from "@/db/queries/wishlist";
import { getAccountsWithType, getAccountById } from "@/db/queries/accounts";
import { getGoals } from "@/db/queries/goals";
import { createWishlistSchema, updateWishlistSchema } from "@/lib/schemas/wishlist";
import type { CreateWishlistInput, UpdateWishlistInput } from "@/lib/schemas/wishlist";

export async function getWishlistAction(
  status: "active" | "purchased" | "cancelled" = "active"
): Promise<ServerActionResult<WishlistRow[]>> {
  try {
    const user = await requireUser();
    const data = await getWishlistItems(user.id, status);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}

export interface Affordability {
  liquidBalance: number;
  allocated: number; // money already saved into active goals (incl. emergency fund) — earmarked cash
  freeCash: number;  // liquid − allocated
}

export async function getAffordabilityAction(): Promise<ServerActionResult<Affordability>> {
  try {
    const user = await requireUser();
    const accounts = await getAccountsWithType(user.id);
    const liquidBalance = accounts
      .filter((a) => a.asset_category === "liquid")
      .reduce((sum, a) => sum + a.current_balance, 0);

    // Allocated = money already PARKED in goals (collected), not the remaining target (that's future savings, not a claim on current liquid).
    // Only count goals whose savings still sit in the LIQUID pool: goals linked to a non-liquid account
    // (e.g. mutual fund, gold) have already left liquid — subtracting them would double-count.
    // Goals with no linked account default to liquid (money assumed parked in a liquid account).
    const goals = await getGoals(user.id);
    const liquidAccountIds = new Set(
      accounts.filter((a) => a.asset_category === "liquid").map((a) => a.id),
    );
    const allocated = goals.reduce((sum, g) => {
      const parkedInLiquid = !g.linked_account_id || liquidAccountIds.has(g.linked_account_id);
      return parkedInLiquid ? sum + Math.max(0, g.collected_amount) : sum;
    }, 0);
    const freeCash = Math.max(0, liquidBalance - allocated);

    return { success: true, data: { liquidBalance, allocated, freeCash } };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}

export async function createWishlistAction(
  input: CreateWishlistInput
): Promise<ServerActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = createWishlistSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }
    const id = await createWishlistItem(user.id, { ...parsed.data, url: parsed.data.url || null });
    return { success: true, data: { id } };
  } catch (error) {
    return { success: false, message: handleApiError(error, "menyimpan data").message };
  }
}

export async function updateWishlistAction(
  itemId: string,
  input: UpdateWishlistInput
): Promise<ServerActionResult<void>> {
  try {
    const user = await requireUser();
    const idParsed = z.string().uuid().safeParse(itemId);
    if (!idParsed.success) return { success: false, message: "Invalid item ID." };

    const parsed = updateWishlistSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }
    await updateWishlistItem(user.id, itemId, { ...parsed.data, ...(parsed.data.url !== undefined ? { url: parsed.data.url || null } : {}) });
    return { success: true };
  } catch (error) {
    return { success: false, message: handleApiError(error, "mengupdate data").message };
  }
}

export async function deleteWishlistAction(
  itemId: string
): Promise<ServerActionResult<void>> {
  try {
    const user = await requireUser();
    const idParsed = z.string().uuid().safeParse(itemId);
    if (!idParsed.success) return { success: false, message: "Invalid item ID." };
    await deleteWishlistItem(user.id, itemId);
    return { success: true };
  } catch (error) {
    return { success: false, message: handleApiError(error, "menghapus data").message };
  }
}

// Task 8b — Promote wishlist → goal
export async function promoteWishlistToGoalAction(
  wishlistId: string,
  linkedAccountId: string | null,
): Promise<ServerActionResult<{ goalId: string }>> {
  try {
    const user = await requireUser();
    const parsed = z.string().uuid().safeParse(wishlistId);
    if (!parsed.success) return { success: false, message: "Invalid wishlist ID." };
    // verify account ownership if provided
    if (linkedAccountId) {
      const acc = await getAccountById(user.id, linkedAccountId);
      if (!acc) return { success: false, message: "Invalid account." };
    }
    const goalId = await promoteWishlistToGoal(user.id, wishlistId, linkedAccountId);
    return { success: true, data: { goalId } };
  } catch (error) {
    return { success: false, message: handleApiError(error, "menyimpan data").message };
  }
}
