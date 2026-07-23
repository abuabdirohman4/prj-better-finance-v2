import type { AssetCategory, CategoryGroup, GoalType, PlanTier, TransactionType } from "@/lib/constants";

// ── User ──────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  plan_tier: PlanTier;
  plan_expires_at: string | null;
  currency_code: string;
  locale: string;
  timezone: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// ── Account ───────────────────────────────────────────────────────────────────

export interface AccountType {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  color_hex: string | null;
  icon_name: string | null;
  sort_order: number;
  is_system: boolean;
}

export interface AccountBase {
  id: string;
  user_id: string;
  account_type_id: string;
  name: string;
  slug: string;
  description: string | null;
  current_balance: number;
  last_reality_check: number | null;
  last_reality_check_at: string | null;
  asset_category: AssetCategory;
  icon_name: string | null;
  color_hex: string | null;
  is_active: boolean;
  include_in_net_worth: boolean;
  is_wallet: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Account extends AccountBase {
  account_type?: AccountType;
}

export interface AccountWithType extends AccountBase {
  account_type: AccountType;
  account_type_name: string;
  account_type_slug: string;
}

// ── Category ──────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  group_name: CategoryGroup;
  icon_name: string | null;
  color_hex: string | null;
  sort_order: number;
  is_system: boolean;
  is_active: boolean;
}

// ── Transaction ───────────────────────────────────────────────────────────────

export interface TransactionBase {
  id: string;
  user_id: string;
  transaction_date: string;
  transaction_type: TransactionType;
  account_id: string;
  category_id: string | null;
  to_account_id: string | null;
  note: string | null;
  amount: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithDetails extends TransactionBase {
  account?: AccountBase;
  category?: Category | null;
  to_account?: AccountBase | null;
}

// ── Budget ────────────────────────────────────────────────────────────────────

export interface Budget {
  id: string;
  user_id: string;
  budget_year: number;
  budget_month: number;
  category_id: string;
  budgeted_amount: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetWithSpending extends Budget {
  category: Category;
  actual_spent: number;
  transaction_count: number;
  percent: number;
}

// ── Goal ──────────────────────────────────────────────────────────────────────

export interface SavingsGoalBase {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon_name: string | null;
  goal_type: GoalType;
  target_amount: number;
  monthly_contribution: number | null;
  deadline_date: string | null;
  duration_label: string | null;
  collected_amount: number;
  retained_amount: number;
  is_completed: boolean;
  is_active: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalWithProgress extends SavingsGoalBase {
  progress_percent: number;
}

// ── Wishlist ──────────────────────────────────────────────────────────────────

export type WishlistStatus = "active" | "purchased" | "cancelled" | "deferred";

export interface WishlistItem {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  url: string | null;
  image_url: string | null;
  estimated_price: number;
  priority: number;
  status: WishlistStatus;
  linked_goal_id: string | null;
  target_date: string | null;
  purchased_at: string | null;
  purchased_price: number | null;
  created_at: string;
  updated_at: string;
}

// ── Common ────────────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
