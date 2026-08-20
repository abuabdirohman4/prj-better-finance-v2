"use client";
import { Wallet, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/helper";
import { useTranslations } from "next-intl";
import type { TransferBudgetRow } from "@/db/queries/budgets";

interface Props {
  items: TransferBudgetRow[];
  hideBalances: boolean;
  onSetBudget?: (item: TransferBudgetRow) => void;
}

const MASK = "Rp •••";

export function SavingBudgetSection({ items, hideBalances, onSetBudget }: Props) {
  const t = useTranslations("budgets");
  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-900 text-lg">{t("budgetTransfers")}</h2>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 space-y-2">
        {items.map(item => {
          const barWidth = Math.min(item.percent, 100);
          const remaining = item.budgeted_amount - item.actual_amount;
          const isGood = item.percent >= 100;
          return (
            <button
              key={item.type}
              onClick={() => onSetBudget?.(item)}
              className="w-full text-left bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 hover:border-blue-100 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                    {item.type === "saving"
                      ? <Wallet className="w-5 h-5" />
                      : <TrendingUp className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-800 block mb-0.5">{item.label}</span>
                    <span className="text-[11px] text-gray-500 block">
                      {hideBalances ? MASK : `${formatCurrency(item.actual_amount)} / ${formatCurrency(item.budgeted_amount)}`}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {item.budgeted_amount === 0 ? (
                    <span className="text-xs text-blue-500 font-medium">{t("setBudget")}</span>
                  ) : (
                    <span className="font-bold text-sm text-gray-900 block">
                      {hideBalances ? MASK : formatCurrency(remaining > 0 ? remaining : 0)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isGood ? "bg-green-500" : "bg-blue-500"}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className={`text-[11px] font-bold ${isGood ? "text-green-600" : "text-blue-600"} min-w-[32px] text-right`}>
                  {item.percent.toFixed(0)}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
