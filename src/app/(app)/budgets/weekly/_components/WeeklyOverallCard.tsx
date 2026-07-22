"use client";
import { Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/helper";
import type { WeeklyCategoryData } from "../_utils/budgetCalculations";

const MASK = "Rp •••";

interface Props {
  weeklyData: WeeklyCategoryData[];
  hideBalances: boolean;
}

export function WeeklyOverallCard({ weeklyData, hideBalances }: Props) {
  const totalBudget = weeklyData.reduce((s, d) => s + d.weeklyBudget, 0);
  const totalSpent = weeklyData.reduce((s, d) => s + d.weeklySpending, 0);
  const remaining = totalBudget - totalSpent;
  const percent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl p-4.5 shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <h2 className="font-bold text-gray-900 text-lg">Overall Weekly Progress</h2>
        <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5" />
        </div>
      </div>

      <div className="flex justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Spending / Budget</p>
          <p className="font-bold text-gray-900">
            {hideBalances ? MASK : `${formatCurrency(totalSpent)} / ${formatCurrency(totalBudget)}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-0.5">Remaining</p>
          <p className={`font-bold text-lg ${remaining < 0 ? "text-red-600" : "text-gray-900"}`}>
            {hideBalances ? MASK : formatCurrency(remaining)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${percent > 100 ? "bg-red-500" : percent >= 80 ? "bg-amber-400" : "bg-green-500"}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        <span className="text-sm font-bold text-green-600 min-w-[36px] text-right">
          {percent.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
