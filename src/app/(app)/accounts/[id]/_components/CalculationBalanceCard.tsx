"use client";

import { formatCurrency, formatLastUpdated } from "@/lib/helper";
import { isBankAccount } from "@/lib/accountVisuals";
import type { AccountRow } from "@/db/queries/accounts";
import { useTranslations } from "next-intl";

interface Props {
  account: AccountRow;
  liveRealityCheck?: number | null; // input user saat ini (sebelum submit)
  hideBalances: boolean;
}

const MASK = "Rp •••";

function diffColorClass(diff: number): string {
  if (diff === 0) return "bg-green-50 border-green-200 text-green-700";
  return diff > 0 ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-red-50 border-red-200 text-red-700";
}

function diffLabel(diff: number): string {
  if (diff === 0) return "Perfect Match!";
  return diff > 0 ? "You have more money than recorded" : "You have less money than recorded";
}

export function CalculationBalanceCard({ account, liveRealityCheck, hideBalances }: Props) {
  const t = useTranslations("accounts");
  const tc = useTranslations("common");
  const isBank = isBankAccount(account.account_type_slug);

  // Prefer live input, fallback to stored value
  const realityVal = liveRealityCheck ?? account.last_reality_check;
  const diff = realityVal != null ? realityVal - account.current_balance : null;

  // Renders a balance number respecting privacy + bank superscript
  function formatBal(n: number) {
    if (hideBalances) return <span>{MASK}</span>;
    if (isBank) {
      return (
        <span
          dangerouslySetInnerHTML={{ __html: formatCurrency(n, "superscript") }}
        />
      );
    }
    return <span>{formatCurrency(n)}</span>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 overflow-hidden">
      {/* Header */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{t("calculationBalance")}</h2>

      <div className="space-y-3">
        {/* Current Balance row */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500">{t("currentBalance")}</span>
          <span className="font-bold text-lg text-gray-900">
            {formatBal(account.current_balance)}
          </span>
        </div>

        {/* Reality Balance row */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500">{t("realityBalance")}</span>
          <span className="font-bold text-lg text-blue-600">
            {realityVal != null ? (
              hideBalances ? (
                MASK
              ) : (
                formatBal(realityVal)
              )
            ) : (
              <span className="italic text-gray-400 font-normal">{tc("notRecorded")}</span>
            )}
          </span>
        </div>

        {/* Difference box */}
        {diff != null && (
          <div className="border-t border-gray-300 pt-4">
          <div className={`rounded-xl border px-4 py-3 text-center ${diffColorClass(diff)}`}>
            <p className="text-lg font-bold">
              {hideBalances
                ? MASK
                : diff === 0
                  ? "✓"
                  : formatCurrency(diff, "signs")}
            </p>
            <p className="text-xs mt-0.5 opacity-80">{diffLabel(diff)}</p>
          </div>
          </div>
        )}

        {/* Footer: last updated */}
        {account.last_reality_check_at && (
          <div className="text-right mt-1">
            <span className="text-xs text-gray-400">
              Updated {formatLastUpdated(account.last_reality_check_at)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
