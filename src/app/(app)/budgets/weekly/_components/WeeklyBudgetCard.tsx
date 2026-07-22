"use client";
import { formatCurrency } from "@/lib/helper";
import type { WeeklyCategoryData } from "../_utils/budgetCalculations";

const CATEGORY_ICONS: Record<string, string> = {
  "Dining Out": "🍽️",
  "Food": "🍕",
  "Fruits": "🍎",
  "Groceries": "🛒",
  "Grab Credit": "🚗",
};

const MASK = "Rp •••";

function getColors(pct: number) {
  if (pct > 100) return { bar: "bg-red-500", text: "text-red-600", badge: "bg-red-100 text-red-700" };
  if (pct >= 80) return { bar: "bg-amber-400", text: "text-amber-600", badge: "bg-amber-100 text-amber-700" };
  return { bar: "bg-green-500", text: "text-green-600", badge: "bg-green-100 text-green-700" };
}

interface Props {
  data: WeeklyCategoryData;
  hideBalances: boolean;
}

export function WeeklyBudgetCard({ data, hideBalances }: Props) {
  const colors = getColors(data.percent);
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-xl shrink-0">
            {CATEGORY_ICONS[data.categoryName] || "📦"}
          </div>
          <div>
            <span className="font-semibold text-sm text-gray-800 block mb-0.5">{data.categoryName}</span>
            <p className="text-xs text-gray-500">
              {hideBalances ? MASK : `${formatCurrency(data.weeklySpending)} / ${formatCurrency(data.weeklyBudget)}`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`font-bold text-sm block ${data.remaining < 0 ? "text-red-600" : "text-green-600"}`}>
            {hideBalances ? MASK : formatCurrency(data.remaining)}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-3 mt-1">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${Math.min(data.percent, 100)}%` }} />
        </div>
        <span className={`text-[13px] font-bold ${colors.text} min-w-[36px] text-right`}>
          {data.percent.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
