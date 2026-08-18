"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useAssets } from "../_hooks/useAssets";
import { formatCurrency } from "@/lib/helper";
import { usePrivacyStore } from "@/stores/privacyStore";
import { productLabel } from "@/lib/investment";

const MASK = "Rp •••.•••";

export default function InvestmentGroupPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group: rawGroup } = use(params); // React 19: params is a Promise
  const groupKey = decodeURIComponent(rawGroup);

  const { data, isLoading, isError } = useAssets();
  const hideBalances = usePrivacyStore((s) => s.hideBalances);
  const toggle = usePrivacyStore((s) => s.toggleHideBalances);

  const group = data?.investmentGroups.find((g) => g.key === groupKey);

  return (
    <div className="bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen pb-24">
      {/* Header gradient */}
      <div className="relative overflow-hidden bg-linear-to-r from-blue-600 via-blue-700 to-indigo-800 px-6 py-7">
        <div className="absolute bottom-0 left-0 w-full h-8">
          <svg viewBox="0 0 400 32" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,32 Q100,20 200,32 T400,20 L400,32 Z" fill="rgb(249 250 251)" />
          </svg>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/assets"
              className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors"
            >
              <ChevronLeft className="w-7 h-7" />
            </Link>
            <h1 className="text-xl font-bold text-white">{group?.label ?? "Investment"}</h1>
          </div>
          <button
            onClick={toggle}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            aria-label="Toggle balance visibility"
          >
            {hideBalances ? (
              <EyeOff className="w-5 h-5 text-white" />
            ) : (
              <Eye className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      <div className="px-4 pb-8 mt-6 space-y-6">
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="animate-pulse bg-gray-200 h-10 w-48 rounded mx-auto" />
          </div>
        ) : isError ? (
          <p className="text-red-500 text-sm px-1">Failed to load data.</p>
        ) : !group ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
            <p className="text-gray-500 text-sm">Group not found.</p>
            <Link href="/assets" className="text-blue-600 text-sm font-semibold mt-2 inline-block">
              Back to Net Worth
            </Link>
          </div>
        ) : (
          <>
            {/* Group total */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col items-center justify-center text-center">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Total Invested
              </p>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                {hideBalances ? MASK : formatCurrency(group.total)}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {group.items.length} {group.items.length === 1 ? "product" : "products"}
              </p>
            </div>

            {/* Sub-products */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 divide-y divide-gray-100 overflow-hidden">
              {group.items.map((item) => {
                // Inisial dari label produk ("Antam 1g" → "AN"), bukan nama penuh yang
                // selalu diawali prefix grup ("Emas : ..." → "EM" untuk semua sub-produk).
                const label = productLabel(item.name);
                const initials = label.substring(0, 2).toUpperCase();
                return (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="shrink-0 w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-[11px] font-bold text-white">
                      {initials}
                    </div>
                    <p className="flex-1 min-w-0 font-semibold text-gray-900 text-sm truncate">
                      {label}
                    </p>
                    <p className="shrink-0 font-bold text-gray-900 text-sm">
                      {hideBalances ? MASK : formatCurrency(item.current_balance)}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
