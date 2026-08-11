"use client";

import { useState } from "react";
import { ChevronDown, Receipt, Pizza, Home, Wallet, Gift, BarChart3, Banknote } from "lucide-react";
import { formatCurrency } from "@/lib/helper";
import { CATEGORY_GROUP_LABELS } from "@/lib/constants";
import { BudgetCard } from "./BudgetCard";
import type { BudgetWithSpending } from "@/db/queries/budgets";

const GROUP_ICONS: Record<string, React.ReactNode> = {
  eating: <Pizza className="w-5 h-5" />,
  living: <Home className="w-5 h-5" />,
  saving: <Wallet className="w-5 h-5" />,
  giving: <Gift className="w-5 h-5" />,
  investing: <BarChart3 className="w-5 h-5" />,
  earning: <Banknote className="w-5 h-5" />,
  lainnya: <Receipt className="w-5 h-5" />
};

interface Props {
  group: string;
  items: BudgetWithSpending[];
  hideBalances: boolean;
  onTap: (b: BudgetWithSpending) => void;
}

const MASK = "Rp •••";

export function BudgetGroup({ group, items, hideBalances, onTap }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const groupBudget = items.reduce((s, b) => s + Number(b.budgeted_amount), 0);
  const groupSpent = items.reduce((s, b) => s + Number(b.actual_spending), 0);
  const groupPercent = groupBudget > 0 ? (groupSpent / groupBudget) * 100 : 0;
  const remaining = groupBudget - groupSpent;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="w-full text-left flex items-center p-3 mb-2 gap-3 cursor-pointer focus:outline-none rounded-xl hover:bg-gray-100/50 transition-colors"
      >
        <div className={`w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0 shadow-sm ${group === 'earning' ? 'bg-green-500' : 'bg-blue-500'}`}>
          {GROUP_ICONS[group] || <Receipt className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-0.5">
            <h3 className="font-bold text-gray-900 capitalize text-base">
              {CATEGORY_GROUP_LABELS[group as keyof typeof CATEGORY_GROUP_LABELS] ?? group}
            </h3>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-[15px]">
                {hideBalances ? MASK : formatCurrency(remaining, "short")}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
            </div>
          </div>
          <p className="text-[13px] text-gray-500">
            {hideBalances ? MASK : `${formatCurrency(groupSpent, "short")} / ${formatCurrency(groupBudget, "short")}`}
          </p>
        </div>
      </button>

      {/* Group Progress Bar */}
      <div className="px-3 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${Math.min(groupPercent, 100)}%` }}
            />
          </div>
          <span className="text-xs font-bold text-green-600">{groupPercent.toFixed(0)}%</span>
        </div>
      </div>

      {/* Individual Items */}
      {!collapsed && (
        <div className="space-y-2 px-1 pb-1">
          {items.map((b) => (
            <BudgetCard key={b.id} budget={b} onTap={onTap} hideBalances={hideBalances} isEarning={group === "earning"} />
          ))}
        </div>
      )}
    </div>
  );
}
