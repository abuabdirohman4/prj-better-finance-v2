import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { accounts, accountTypes, categories, transactions } from "@/db/schema";

// ── Types (query results — numeric kolom di-cast ke number) ─────────────────────

export interface AccountRow {
  id: string;
  name: string;
  slug: string;
  current_balance: number;
  last_reality_check: number | null;
  last_reality_check_at: string | null;
  asset_category: string;
  icon_name: string | null;
  color_hex: string | null;
  is_wallet: boolean;
  include_in_net_worth: boolean;
  sort_order: number;
  account_type_slug: string;
  account_type_name: string;
}

export interface RecentTransactionRow {
  id: string;
  transaction_date: string;
  transaction_type: string;
  note: string | null;
  amount: number;
  category_name: string | null;
}

export interface DashboardData {
  accounts: AccountRow[];
  totalAssets: number;
  recentTransactions: RecentTransactionRow[];
}

// ── Queries ─────────────────────────────────────────────────────────────────────

/** Semua akun aktif milik user, join account_type, urut sort_order. */
export async function getAccountsWithType(userId: string): Promise<AccountRow[]> {
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
    .where(and(eq(accounts.user_id, userId), eq(accounts.is_active, true)))
    .orderBy(accounts.sort_order);

  return rows.map(mapAccountRow);
}

/** Data dashboard: akun + total assets + transaksi terbaru. */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [accountRows, txRows] = await Promise.all([
    getAccountsWithType(userId),
    db
      .select({
        id: transactions.id,
        transaction_date: transactions.transaction_date,
        transaction_type: transactions.transaction_type,
        note: transactions.note,
        amount: transactions.amount,
        category_name: categories.name,
      })
      .from(transactions)
      .leftJoin(categories, eq(categories.id, transactions.category_id))
      .where(and(eq(transactions.user_id, userId), isNull(transactions.deleted_at)))
      .orderBy(desc(transactions.transaction_date), desc(transactions.created_at))
      .limit(5),
  ]);

  const totalAssets = accountRows
    .filter((a) => a.include_in_net_worth)
    .reduce((sum, a) => sum + a.current_balance, 0);

  const recentTransactions: RecentTransactionRow[] = txRows.map((t) => ({
    id: t.id,
    transaction_date: t.transaction_date,
    transaction_type: t.transaction_type,
    note: t.note,
    amount: Number(t.amount),
    category_name: t.category_name,
  }));

  return { accounts: accountRows, totalAssets, recentTransactions };
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

// postgres-js kembalikan numeric sebagai string → cast ke number
function mapAccountRow(r: {
  id: string;
  name: string;
  slug: string;
  current_balance: string;
  last_reality_check: string | null;
  last_reality_check_at: Date | null;
  asset_category: string;
  icon_name: string | null;
  color_hex: string | null;
  is_wallet: boolean;
  include_in_net_worth: boolean;
  sort_order: number;
  account_type_slug: string;
  account_type_name: string;
}): AccountRow {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    current_balance: Number(r.current_balance),
    last_reality_check: r.last_reality_check == null ? null : Number(r.last_reality_check),
    last_reality_check_at: r.last_reality_check_at ? r.last_reality_check_at.toISOString() : null,
    asset_category: r.asset_category,
    icon_name: r.icon_name,
    color_hex: r.color_hex,
    is_wallet: r.is_wallet,
    include_in_net_worth: r.include_in_net_worth,
    sort_order: r.sort_order,
    account_type_slug: r.account_type_slug,
    account_type_name: r.account_type_name,
  };
}
