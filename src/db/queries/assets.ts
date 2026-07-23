import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";

export interface AssetRow {
  id: string;
  name: string;
  current_balance: number;
  asset_category: string; // "liquid" | "non-liquid"
  icon_name: string | null;
  color_hex: string | null;
}

export interface AssetsSummary {
  assets: AssetRow[];
  totalLiquid: number;
  totalNonLiquid: number;
  netWorth: number;
}

export async function getAssets(userId: string): Promise<AssetsSummary> {
  const rows = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      current_balance: sql<number>`${accounts.current_balance}::numeric`,
      asset_category: accounts.asset_category,
      icon_name: accounts.icon_name,
      color_hex: accounts.color_hex,
    })
    .from(accounts)
    .where(and(
      eq(accounts.user_id, userId),
      eq(accounts.is_active, true),
      eq(accounts.include_in_net_worth, true),
    ))
    .orderBy(accounts.asset_category, accounts.sort_order);

  const totalLiquid = rows.filter(r => r.asset_category === "liquid").reduce((s, r) => s + Number(r.current_balance), 0);
  const totalNonLiquid = rows.filter(r => r.asset_category === "non-liquid").reduce((s, r) => s + Number(r.current_balance), 0);

  return { 
    assets: rows.map(r => ({ ...r, current_balance: Number(r.current_balance) })), 
    totalLiquid, 
    totalNonLiquid, 
    netWorth: totalLiquid + totalNonLiquid 
  };
}
