"use client";

import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/helper";
import { usePrivacyStore } from "@/stores/privacyStore";
import { cn } from "@/lib/utils";
import type { TransactionRow } from "@/db/queries/transactions";

const MASK = "Rp \u2022\u2022\u2022\u2022";

const TYPE_CONFIG = {
  spending: {
    icon: ArrowDownLeft,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    amountColor: "text-red-600",
    sign: "signs" as const,
  },
  earning: {
    icon: ArrowUpRight,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    amountColor: "text-green-600",
    sign: "signs" as const,
  },
  transfer: {
    icon: ArrowLeftRight,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    amountColor: "text-blue-600",
    sign: undefined,
  },
};

export function TransactionCard({
  tx,
  onEdit,
}: {
  tx: TransactionRow;
  onEdit?: (tx: TransactionRow) => void;
}) {
  const hideBalances = usePrivacyStore((s) => s.hideBalances);
  const cfg =
    TYPE_CONFIG[tx.transaction_type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.spending;
  const Icon = cfg.icon;

  const title = tx.note ?? tx.category_name ?? tx.account_name;
  const isTransfer = tx.transaction_type === "transfer";

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 transition-colors",
        onEdit && "cursor-pointer active:bg-gray-50 hover:bg-gray-50/60"
      )}
      onClick={() => onEdit?.(tx)}
      role={onEdit ? "button" : undefined}
    >
      {/* Icon circle */}
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          cfg.iconBg
        )}
      >
        <Icon className={cn("w-5 h-5", cfg.iconColor)} />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate mb-0.5">{title}</p>
        {isTransfer ? (
          <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
            <ArrowLeftRight className="w-3 h-3 shrink-0" />
            {tx.account_name} \u2192 {tx.to_account_name ?? "?"}
          </p>
        ) : (
          <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
            <Building2 className="w-3 h-3 shrink-0" />
            {tx.category_name ?? tx.account_name}
          </p>
        )}
      </div>

      {/* Amount */}
      <div className={cn("text-sm font-bold shrink-0", cfg.amountColor)}>
        {hideBalances ? (
          MASK
        ) : cfg.sign ? (
          <span
            dangerouslySetInnerHTML={{
              __html: formatCurrency(
                tx.transaction_type === "spending" ? -tx.amount : tx.amount,
                cfg.sign
              ),
            }}
          />
        ) : (
          formatCurrency(tx.amount)
        )}
      </div>
    </div>
  );
}
