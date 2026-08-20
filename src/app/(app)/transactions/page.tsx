"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Calculator, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import { useTransactions } from "./_hooks/useTransactions";
import { useAccounts } from "../accounts/_hooks/useAccounts";
import { useCategories } from "./_hooks/useCategories";
import { TransactionCard } from "./_components/TransactionCard";
import { TransactionBottomSheet } from "./_components/TransactionBottomSheet";
import { FilterBar, FilterBarPanel } from "./_components/FilterBar";
import { formatCurrency, formatDate } from "@/lib/helper";
import { usePrivacyStore } from "@/stores/privacyStore";
import type { TransactionFilters, TransactionRow } from "@/db/queries/transactions";
import { Fab } from "@/components/layouts/Fab";
import { useTranslations } from "next-intl";

const MASK = "Rp •••";

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function getMonthRange(year: number, month: number): { date_from: string; date_to: string } {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { date_from: from, date_to: to };
}

function groupByDate(txs: TransactionRow[]): Record<string, TransactionRow[]> {
  return txs.reduce((acc, tx) => {
    const date = tx.transaction_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {} as Record<string, TransactionRow[]>);
}

export default function TransactionsPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(now.getMonth() + 1); // 1-12, null = all
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [baseFilters, setBaseFilters] = useState<TransactionFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionRow | null>(null);

  const hideBalances = usePrivacyStore((s) => s.hideBalances);
  const t = useTranslations("transactions");
  const tc = useTranslations("common");

  // Merge month+year range into filters; null month = all time
  const filters: TransactionFilters = {
    ...baseFilters,
    ...(selectedMonth != null ? getMonthRange(selectedYear, selectedMonth) : {}),
  };

  const { data: transactions, isLoading, isError } = useTransactions(filters);
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  function openEdit(tx: TransactionRow) {
    setSelectedTx(tx);
    setSheetOpen(true);
  }

  function openCreate() {
    setSelectedTx(null);
    setSheetOpen(true);
  }

  const earning = transactions?.filter((t) => t.transaction_type === "earning").reduce((s, t) => s + t.amount, 0) ?? 0;
  const spending = transactions?.filter((t) => t.transaction_type === "spending").reduce((s, t) => s + t.amount, 0) ?? 0;
  const net = earning - spending;

  const grouped = transactions ? groupByDate(transactions) : {};
  const sortedDates = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

  return (
    <div className="bg-blue-50 min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden bg-linear-to-r from-blue-600 via-blue-700 to-indigo-800 px-4 pt-5 pb-6">
        <div className="absolute bottom-0 left-0 w-full h-8">
          <svg viewBox="0 0 400 32" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,32 Q100,20 200,32 T400,20 L400,32 Z" fill="rgb(249 250 251)" />
          </svg>
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="p-2 rounded-full hover:bg-white/20 transition-colors" aria-label={tc("back")}>
              <ChevronLeft className="w-7 h-7 text-white" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
              {/* <p className="text-blue-100 text-sm">{t("subtitle")}</p> */}
            </div>
          </div>

          {/* Month + Year picker */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedMonth ?? ""}
                onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : null)}
                className="appearance-none bg-white/20 text-white border border-white/30 rounded-xl px-3 py-2 pr-7 text-sm font-semibold focus:outline-none cursor-pointer"
              >
                <option value="" className="text-gray-900 bg-white">{tc("all")}</option>
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1} className="text-gray-900 bg-white">{m}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/80" />
            </div>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="appearance-none bg-white/20 text-white border border-white/30 rounded-xl px-3 py-2 pr-7 text-sm font-semibold focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => (
                  <option key={y} value={y} className="text-gray-900 bg-white">{y}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/80" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 mt-6 pb-28 space-y-4">
        {/* Net Balance card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-700">{t("netBalance")}</h2>
            <div className="w-10 h-10 bg-linear-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className={`text-3xl font-bold ${net >= 0 ? "text-gray-900" : "text-red-600"}`}>
            {hideBalances ? MASK : formatCurrency(net, "signs")}
          </p>
        </div>

        {/* Earning + Spending */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-linear-to-br from-green-50 to-emerald-100 rounded-2xl border border-green-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <ArrowUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-green-800">{t("earning")}</span>
            </div>
            <p className="text-xl font-bold text-green-900">
              {hideBalances ? MASK : formatCurrency(earning)}
            </p>
          </div>
          <div className="bg-linear-to-br from-red-50 to-rose-100 rounded-2xl border border-red-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <ArrowDown className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-red-800">{t("spending")}</span>
            </div>
            <p className="text-xl font-bold text-red-900">
              {hideBalances ? MASK : formatCurrency(spending)}
            </p>
          </div>
        </div>

        {/* Transaction card wrapper — v1 style: satu card besar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header: "Transaction" + Show Filters toggle */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">{t("transaction")}</h2>
            <FilterBar
              accounts={accounts}
              categories={categories}
              onFiltersChange={setBaseFilters}
              open={showFilters}
              onToggle={() => setShowFilters((v) => !v)}
            />
          </div>

          {/* Filter panel — inside the card */}
          {showFilters && (
            <div className="px-4 pt-3 pb-2 border-b border-gray-100">
              <FilterBarPanel
                accounts={accounts}
                categories={categories}
                onFiltersChange={setBaseFilters}
              />
            </div>
          )}

          {/* List */}
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-16" />
              ))}
            </div>
          ) : isError ? (
            <div className="p-6 text-center">
              <p className="text-sm text-red-600">{t("loadFailed")}</p>
            </div>
          ) : sortedDates.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 text-sm">{t("empty")}</p>
            </div>
          ) : (
            <div>
              {sortedDates.map((date) => (
                <div key={date}>
                  {/* Date row */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
                    <p className="text-sm font-bold text-gray-800">{formatDate(date)}</p>
                    <p className="text-xs text-gray-400">{grouped[date].length} transactions</p>
                  </div>
                  {/* Transaction rows */}
                  <div className="divide-y divide-gray-50">
                    {grouped[date].map((tx) => (
                      <TransactionCard key={tx.id} tx={tx} onEdit={openEdit} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <Fab onClick={openCreate} label={t("addTransaction")} />

      <TransactionBottomSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setSelectedTx(null); }}
        accounts={accounts}
        categories={categories}
        editTx={selectedTx}
      />
    </div>
  );
}
