"use client";

import { Target, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import { formatCurrency } from "@/lib/helper";
import type { GoalRow } from "@/db/queries/goals";

function getGoalColors(percent: number) {
  if (percent >= 100) return { bar: "bg-green-500", badge: "bg-green-100 text-green-700", iconBg: "bg-green-100 text-green-600" };
  if (percent >= 80)  return { bar: "bg-blue-500",  badge: "bg-blue-100 text-blue-700", iconBg: "bg-blue-100 text-blue-600" };
  if (percent >= 50)  return { bar: "bg-amber-400", badge: "bg-amber-100 text-amber-700", iconBg: "bg-amber-100 text-amber-600" };
  return { bar: "bg-red-500", badge: "bg-red-100 text-red-700", iconBg: "bg-red-100 text-red-600" };
}

interface Props {
  goal: GoalRow;
  onEdit: (goal: GoalRow) => void;
  hideBalances: boolean;
}

export function GoalCard({ goal, onEdit, hideBalances }: Props) {
  const colors = getGoalColors(goal.percent);
  const MASK = "Rp •••";

  return (
    <button
      onClick={() => onEdit(goal)}
      className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-transform"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colors.iconBg}`}>
            {goal.goal_type === "Saving" ? <Target className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">{goal.name}</h3>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${colors.badge}`}>
          {goal.percent.toFixed(0)}%
        </span>
      </div>

      <div className="flex justify-between items-end mb-2 mt-4">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Terkumpul</p>
          <p className="font-bold text-gray-900">
            {hideBalances ? MASK : formatCurrency(goal.collected_amount)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-0.5">Target</p>
          <p className="font-bold text-gray-900">
            {hideBalances ? MASK : formatCurrency(goal.target_amount)}
          </p>
        </div>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full ${colors.bar}`}
          style={{ width: `${Math.min(goal.percent, 100)}%` }}
        />
      </div>

      {goal.deadline_date && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Deadline: {new Date(goal.deadline_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      )}
    </button>
  );
}
