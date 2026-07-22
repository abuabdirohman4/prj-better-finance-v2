import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { walletDenominations } from "@/db/schema";

export interface WalletDenominationRow {
  id: string;
  denomination: number;
  note_type: string;
  count: number;
  updated_at: Date;
}

/** Pecahan IDR yang diakui — source of truth untuk queries dan server validation. */
export const VALID_DENOMINATIONS_BY_TYPE: Record<string, number[]> = {
  paper: [100000, 50000, 20000, 10000, 5000, 2000, 1000],
  coin: [1000, 500, 200, 100],
};

const VALID_DENOMINATIONS = Object.values(VALID_DENOMINATIONS_BY_TYPE).flat();

/** Ambil pecahan wallet untuk satu akun — hanya denominasi valid (50 dan retired lainnya dieksklusi). */
export async function getWalletDenominations(
  userId: string,
  accountId: string
): Promise<WalletDenominationRow[]> {
  const rows = await db
    .select({
      id: walletDenominations.id,
      denomination: walletDenominations.denomination,
      note_type: walletDenominations.note_type,
      count: walletDenominations.count,
      updated_at: walletDenominations.updated_at,
    })
    .from(walletDenominations)
    .where(
      and(
        eq(walletDenominations.user_id, userId),
        eq(walletDenominations.account_id, accountId),
        inArray(walletDenominations.denomination, VALID_DENOMINATIONS)
      )
    )
    .orderBy(walletDenominations.denomination);
  return rows;
}


/**
 * Upsert batch pecahan wallet.
 * UNIQUE constraint: (account_id, denomination, note_type)
 * → on conflict update count + updated_at via raw SQL excluded.*
 */
export async function upsertWalletDenominations(
  userId: string,
  accountId: string,
  rows: { denomination: number; note_type: string; count: number }[]
): Promise<void> {
  if (rows.length === 0) return;
  await db
    .insert(walletDenominations)
    .values(
      rows.map((r) => ({
        account_id: accountId,
        user_id: userId,
        denomination: r.denomination,
        note_type: r.note_type,
        count: r.count,
      }))
    )
    .onConflictDoUpdate({
      target: [
        walletDenominations.account_id,
        walletDenominations.denomination,
        walletDenominations.note_type,
      ],
      set: {
        count: sql`excluded.count`,
        updated_at: sql`now()`,
      },
    });
}
