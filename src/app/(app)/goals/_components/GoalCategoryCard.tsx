"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, DollarSign, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/helper";
import type { GoalRow } from "@/db/queries/goals";
import { GoalCard } from "./GoalCard";

interface Props {
  title: string;
  type: "Saving" | "Investment";
  goals: GoalRow[];
  onEdit: (goal: GoalRow) => void;
  hideBalances: boolean;
}

export function GoalCategoryCard({ title, type, goals, onEdit, hideBalances }: Props) {
  const [isOpen, setIsOpen] = useState(true);

  if (goals.length === 0) return null;

  const totalCollected = goals.reduce((s, g) => s + Number(g.collected_amount), 0);
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const percent = totalTarget > 0 ? (totalCollected / totalTarget) * 100 : 0;

  const MASK = "Rp •••";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      {/* Accordion Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-gray-100/50"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0">
            {type === "Saving" ? <DollarSign className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900 text-lg leading-tight">{title}</h3>
            <p className="text-gray-500 text-sm">{goals.length} goals</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right mr-1">
            <p className="font-semibold text-gray-900 text-sm">
              {hideBalances
                ? `${MASK} / ${MASK}`
                : `${formatCurrency(totalCollected, "short")} / ${formatCurrency(totalTarget, "short")}`}
            </p>
          </div>
          {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {/* Progress Bar under header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-gray-100 flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        <span className="text-sm font-bold text-red-600 w-10 text-right shrink-0">
          {percent.toFixed(0)}%
        </span>
      </div>

      {/* Accordion Body */}
      {isOpen && (
        <div className="p-4 bg-slate-50/50">
          <div className="space-y-3">
            {goals.map((g) => (
              <GoalCard key={g.id} goal={g} onEdit={onEdit} hideBalances={hideBalances} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
