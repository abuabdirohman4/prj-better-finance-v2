import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";

export interface AssetRow {
  id: string;
  name: string;
  current_balance: number;
  asset_category: string; // "liquid" | "investment"
  investment_group: string | null;
  is_liability: boolean;
  icon_name: string | null;
  color_hex: string | null;
}

/** Satu kartu di Net Worth: grup investasi (Emas, Reksadana, ...) atau akun tanpa grup. */
export interface InvestmentGroupRow {
  key: string;   // investment_group, atau id akun kalau tak bergrup — dipakai di URL /assets/[group]
  label: string; // nama tampil grup
  total: number;
  items: AssetRow[];
}

export interface AssetsSummary {
  assets: AssetRow[];
  liabilities: AssetRow[];
  totalLiquid: number;
  totalNonLiquid: number;
  totalLiabilities: number;
  netWorth: number;
  investmentGroups: InvestmentGroupRow[];
}

export async function getAssets(userId: string): Promise<AssetsSummary> {
  const rows = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      current_balance: sql<number>`${accounts.current_balance}::numeric`,
      asset_category: accounts.asset_category,
      investment_group: accounts.investment_group,
      is_liability: accounts.is_liability,
      icon_name: accounts.icon_name,
      color_hex: accounts.color_hex,
    })
    .from(accounts)
    .where(and(
      eq(accounts.user_id, userId),
      eq(accounts.is_active, true),
      eq(accounts.include_in_net_worth, true),
    ))
    .orderBy(accounts.asset_category, accounts.sort_order, accounts.name);

  const nonLiabilityRows = rows.filter((r) => !r.is_liability);
  const liabilityRows = rows.filter((r) => r.is_liability);

  const totalLiquid = nonLiabilityRows
    .filter((r) => r.asset_category === "liquid")
    .reduce((s, r) => s + Number(r.current_balance), 0);
  const totalNonLiquid = nonLiabilityRows
    .filter((r) => r.asset_category !== "liquid")
    .reduce((s, r) => s + Number(r.current_balance), 0);
  const totalLiabilities = liabilityRows.reduce((s, r) => s + Number(r.current_balance), 0);

  const assetRows: AssetRow[] = nonLiabilityRows.map((r) => ({
    ...r,
    current_balance: Number(r.current_balance),
  }));

  // Kartu non-liquid dikelompokkan per investment_group; akun tanpa grup jadi kartu sendiri.
  const groupMap = new Map<string, InvestmentGroupRow>();
  for (const a of assetRows) {
    if (a.asset_category === "liquid") continue;
    const key = a.investment_group ?? a.id;
    const group = groupMap.get(key);
    if (group) {
      group.total += a.current_balance;
      group.items.push(a);
    } else {
      groupMap.set(key, {
        key,
        label: a.investment_group ?? a.name,
        total: a.current_balance,
        items: [a],
      });
    }
  }

  return {
    assets: assetRows,
    liabilities: liabilityRows.map((r) => ({
      ...r,
      current_balance: Number(r.current_balance),
    })),
    totalLiquid,
    totalNonLiquid,
    totalLiabilities,
    netWorth: totalLiquid + totalNonLiquid - totalLiabilities,
    investmentGroups: [...groupMap.values()].sort((a, b) => b.total - a.total),
  };
}
