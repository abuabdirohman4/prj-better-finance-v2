"use client";

import { Target } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/helper";
import { usePrivacyStore } from "@/stores/privacyStore";
import type { WishlistRow } from "@/db/queries/wishlist";

const MASK = "Rp •••.•••";

const PRIORITY_CONFIG: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: "Urgent", color: "text-red-700", bg: "bg-red-100" },
  2: { label: "High", color: "text-orange-700", bg: "bg-orange-100" },
  3: { label: "Normal", color: "text-blue-700", bg: "bg-blue-100" },
  4: { label: "Low", color: "text-gray-600", bg: "bg-gray-100" },
  5: { label: "Someday", color: "text-emerald-700", bg: "bg-emerald-100" },
};

interface WishlistCardProps {
  item: WishlistRow;
  liquidBalance: number;
  freeCash: number;
  onEdit: (item: WishlistRow) => void;
  onPromote: (item: WishlistRow) => void;
}

export function WishlistCard({ item, liquidBalance, freeCash, onEdit, onPromote }: WishlistCardProps) {
  const hideBalances = usePrivacyStore((s) => s.hideBalances);
  const priority = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG[3];
  // 3 tiers: green = enough free cash; amber = liquid covers it but drains goal/EF; red = liquid short.
  const affordTier: "free" | "tight" | "no" =
    freeCash >= item.estimated_price ? "free"
    : liquidBalance >= item.estimated_price ? "tight"
    : "no";
  const shortfall = item.estimated_price - liquidBalance;

  return (
    <div
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer"
      onClick={() => onEdit(item)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-base truncate">{item.name}</h3>
          {item.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
          )}
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${priority.bg} ${priority.color}`}>
          {priority.label}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-lg font-bold text-gray-900">
          {hideBalances ? MASK : formatCurrency(item.estimated_price)}
        </p>
        {item.status === "active" && !item.linked_goal_id && (
          affordTier === "free" ? (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
              ✅ Can buy
            </span>
          ) : affordTier === "tight" ? (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
              ⚠️ Drains allocation
            </span>
          ) : (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600">
              Short {hideBalances ? MASK : formatCurrency(shortfall)}
            </span>
          )
        )}
      </div>

      {/* Promote / linked badge */}
      {item.status === "active" && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {item.linked_goal_id ? (
            <Link
              href="/goals"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"
            >
              <Target className="w-3.5 h-3.5" /> Now a Goal
            </Link>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPromote(item);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
            >
              🎯 Start Saving
            </button>
          )}
        </div>
      )}
    </div>
  );
}
