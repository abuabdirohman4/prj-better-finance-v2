"use client";

import { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { productLabel } from "@/lib/investment";
import type { AccountRow, CategoryRow } from "@/db/queries/accounts";
import type { TransactionFilters } from "@/db/queries/transactions";
import { useTranslations } from "next-intl";

const TX_TYPE_OPTIONS = [
  { value: "spending", label: "Spending" },
  { value: "earning", label: "Earning" },
  { value: "transfer", label: "Transfer" },
];

interface FilterBarProps {
  accounts: AccountRow[];
  categories: CategoryRow[];
  onFiltersChange: (filters: TransactionFilters) => void;
  open: boolean;
  onToggle: () => void;
}

interface FilterBarPanelProps {
  accounts: AccountRow[];
  categories: CategoryRow[];
  onFiltersChange: (filters: TransactionFilters) => void;
}

/** Toggle button for the transaction list header */
export function FilterBar({ open, onToggle, accounts, categories, onFiltersChange }: FilterBarProps) {
  // Count active filters by peeking at panel state via a shared local ref approach
  // Simpler: just show the outline when open
  void accounts; void categories; void onFiltersChange; // consumed by FilterBarPanel
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        open
          ? "border border-blue-600 text-blue-600 bg-blue-50"
          : "text-gray-500 hover:bg-gray-100"
      )}
    >
      <Filter className="w-4 h-4" />
      <span>{open ? "Hide Filters" : "Show Filters"}</span>
    </button>
  );
}

/** Collapsible filter panel — rendered below the list header */
export function FilterBarPanel({ accounts, categories, onFiltersChange }: FilterBarPanelProps) {
  const t = useTranslations("transactions");
  const [types, setTypes] = useState<string[]>([]);
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [note, setNote] = useState("");

  // Akun investasi dikelompokkan per investment_group (optgroup di MultiSelect).
  const accountOptions = accounts.map((a) =>
    a.asset_category === "investment"
      ? { value: a.id, label: productLabel(a.name), group: a.investment_group ?? "Investment" }
      : { value: a.id, label: a.name }
  );
  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
    group: c.group_name,
  }));

  useEffect(() => {
    onFiltersChange({
      type: types.length ? types : undefined,
      account_id: accountIds.length ? accountIds : undefined,
      category_id: categoryIds.length ? categoryIds : undefined,
      note: note.trim() || undefined,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types, accountIds, categoryIds, note]);

  return (
    <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Transaction Type
          </label>
          <MultiSelect
            options={TX_TYPE_OPTIONS}
            value={types}
            onChange={setTypes}
            placeholder={t("allTypes")}
            iconPrefix="💰"
            allOptionLabel="All Types"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Account
          </label>
          <MultiSelect
            options={accountOptions}
            value={accountIds}
            onChange={setAccountIds}
            placeholder={t("allAccounts")}
            iconPrefix="🏦"
            searchable
            allOptionLabel="Semua Akun"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Category
          </label>
          <MultiSelect
            options={categoryOptions}
            value={categoryIds}
            onChange={setCategoryIds}
            placeholder={t("allCategories")}
            iconPrefix="📂"
            searchable
            allOptionLabel="Semua Kategori"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Note
          </label>
          <Input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("searchNotes")}
          />
        </div>
    </div>
  );
}
