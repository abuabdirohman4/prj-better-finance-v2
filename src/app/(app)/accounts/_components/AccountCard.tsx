"use client";

import { Wallet } from "lucide-react";
import { getAccountVisual, isBankAccount } from "@/lib/accountVisuals";
import { formatCurrency, formatLastUpdated } from "@/lib/helper";
import { usePrivacyStore } from "@/stores/privacyStore";
import type { AccountRow } from "@/db/queries/accounts";

const MASK = "Rp ••••";

export function AccountCard({ account }: { account: AccountRow }) {
  const hideBalances = usePrivacyStore((s) => s.hideBalances);
  const visual = getAccountVisual(account.name);
  const isBank = isBankAccount(account.account_type_slug);

  // Difference = reality check - saldo sistem (v1: balancing - balance)
  const difference =
    account.last_reality_check == null
      ? null
      : account.last_reality_check - account.current_balance;

  const isLowBalance = account.current_balance < 50000;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden active:scale-95 transition-all hover:shadow-xl group">
      <div className="p-3 pb-2">
        {/* Logo + nama */}
        <div className="flex flex-col items-center mb-2">
          {visual.isWalletIcon ? (
            <div className={`mb-1 ${visual.iconColor}`}>
              <Wallet className="w-7 h-7" strokeWidth={1.8} />
            </div>
          ) : (
            <div
              className={`mb-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${visual.iconBg ?? "bg-gray-500"} ${visual.iconColor}`}
            >
              {visual.initials}
            </div>
          )}
          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-sm text-center truncate w-full">
            {account.name}
          </h3>
        </div>

        {/* Difference */}
        <div className="text-center border-t border-gray-100 pt-1">
          <div className={`text-xs font-bold ${differenceColor(difference)}`}>
            {difference == null || difference === 0
              ? "-"
              : hideBalances
                ? MASK
                : formatCurrency(difference, "signs")}
          </div>
        </div>

        {/* Last updated */}
        {account.last_reality_check_at && (
          <div className="text-center">
            <div className="text-[10px] text-gray-400">
              {formatLastUpdated(account.last_reality_check_at)}
            </div>
          </div>
        )}
      </div>

      {/* Balance bar */}
      <div className={`${visual.accent} px-3 py-1.5 rounded-b-2xl`}>
        <div className="text-center">
          {hideBalances ? (
            <span className={`font-bold text-xs ${visual.text}`}>{MASK}</span>
          ) : isBank ? (
            <span
              className={`font-bold text-xs ${isLowBalance ? "text-red-600" : visual.text}`}
              dangerouslySetInnerHTML={{
                __html: formatCurrency(account.current_balance, "superscript"),
              }}
            />
          ) : (
            <span className={`font-bold text-xs ${isLowBalance ? "text-red-600" : visual.text}`}>
              {formatCurrency(account.current_balance)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function differenceColor(diff: number | null): string {
  if (diff == null || diff === 0) return "text-gray-400";
  return diff > 0 ? "text-green-600" : "text-red-600";
}
