"use client";

import { useState } from "react";
import { ChevronDown, Wallet, Target, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/helper";
import type { SavingBudgetRow } from "@/db/queries/goals";

interface Props {
  items: SavingBudgetRow[];
  hideBalances: boolean;
}

const MASK = "Rp •••";

export function SavingBudgetSection({ items, hideBalances }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  if (items.length === 0) return null;
  
  const groupBudget = items.reduce((s, i) => s + i.monthly_target, 0);
  const groupSpent = items.reduce((s, i) => s + i.actual_saved, 0);
  const groupPercent = groupBudget > 0 ? (groupSpent / groupBudget) * 100 : 0;
  const remaining = groupBudget - groupSpent;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="w-full text-left flex items-center p-3 mb-2 gap-3 cursor-pointer focus:outline-none rounded-xl hover:bg-gray-100/50 transition-colors"
      >
        <div className="w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0 shadow-sm bg-blue-500">
          <Wallet className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-0.5">
            <h3 className="font-bold text-gray-900 capitalize text-base">
              Savings
            </h3>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-[15px]">
                {hideBalances ? MASK : formatCurrency(remaining > 0 ? remaining : 0, "short")}
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
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${Math.min(groupPercent, 100)}%` }}
            />
          </div>
          <span className="text-xs font-bold text-blue-600">{groupPercent.toFixed(0)}%</span>
        </div>
      </div>

      {/* Individual Items */}
      {!collapsed && (
        <div className="space-y-2 px-1 pb-1">
          {items.map((b) => {
            const barWidth = Math.min(b.percent, 100);
            const itemRemaining = b.monthly_target - b.actual_saved;
            let barColor = "bg-blue-500";
            let textColor = "text-blue-600";
            if (b.percent >= 100) {
              barColor = "bg-green-500";
              textColor = "text-green-600";
            }

            return (
              <div
                key={b.goal_id}
                className="w-full text-left bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 hover:border-blue-100 transition-all shrink-0"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                       {b.goal_type === "Saving" ? <Target className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-800 block mb-0.5">{b.goal_name}</span>
                      <span className="text-[11px] text-gray-500 block">
                        {hideBalances ? MASK : `${formatCurrency(b.actual_saved)} / ${formatCurrency(b.monthly_target)}`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                     <span className="font-bold text-sm text-gray-900 block">
                       {hideBalances ? MASK : formatCurrency(itemRemaining > 0 ? itemRemaining : 0)}
                     </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-bold ${textColor} min-w-[32px] text-right`}>{b.percent.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
