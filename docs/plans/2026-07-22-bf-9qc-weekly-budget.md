# Plan: Weekly Budget Tracker (bf-9qc)

**Date:** 2026-07-22
**Issue:** bf-9qc · P2 Feature
**Route:** `/budgets/weekly`
**Scope:** Read-only weekly view derived from monthly budgets. Cascade algorithm: sisa/lebih minggu lalu carry forward ke minggu berikutnya. Hanya kategori `eating` (sama dengan v1).

---

## Context

v1 referensi: `/Users/abuabdirohman/Documents/Programs/Project/prj-better-finance/app/budgets/weekly/`

Weekly budget **tidak punya tabel sendiri di DB** — semua derived:
- Budget mingguan = monthly budget (dari tabel `budgets`) ÷ distribusi proporsional per hari
- Spending per minggu = query `transactions` filter `transaction_date` antara startDate–endDate minggu itu
- Cascade: sisa/lebih minggu lalu diakumulasi ke minggu berikutnya

**Eating categories** (sama v1, match `categories.name` di DB):
```
Dining Out, Food, Fruits, Groceries, Grab Credit
```
Hanya kategori ini yang ditampilkan di weekly budget.

**Week definition (Mon–Sun):**
- Week 1: mulai 1 tanggal bulan (bukan Senin pertama) → berakhir Minggu pertama
- Week 2+: Senin–Minggu
- Week terakhir: Senin → akhir bulan (tidak melampaui bulan)
- Jumlah minggu: 4–6 (tergantung hari pertama bulan)

**Monthly budget untuk eating categories sudah ada** via `getBudgetsWithSpending` — perlu filter `group_name = 'eating'`.

---

## Files yang Dibuat / Diubah

```
src/app/(app)/budgets/weekly/
  page.tsx                          ← NEW: main page
  _utils/
    dateCalculations.ts             ← NEW: getWeeksInMonth, getWeekInfo (port dari v1)
    budgetCalculations.ts           ← NEW: cascade weekly budget algorithm (port dari v1)
  _hooks/
    useWeeklyBudget.ts              ← NEW: TanStack Query hook + week selection state
  _components/
    WeeklyBudgetCard.tsx            ← NEW: per-category card dengan progress bar
    WeeklyOverallCard.tsx           ← NEW: overall summary card
```

Total: 6 file baru. Tidak ada DB migration — semua computed dari data existing.

---

## Task 1 — Date Calculations (`_utils/dateCalculations.ts`)

Port dari v1 `dateCalculations.js`, adaptasi ke TypeScript + gunakan `year`/`month` number bukan string month name.

```ts
export interface WeekInfo {
  week: number;
  startDate: Date;   // untuk filter transaksi
  endDate: Date;     // untuk filter transaksi
  budgetStartDate: Date;  // untuk hitung proporsi hari dalam bulan
  budgetEndDate: Date;
}

/** Hitung jumlah minggu dalam bulan (4–6) */
export function getWeeksInMonth(year: number, month: number): number {
  // month = 1-based
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  let weeks = 0;
  let current = new Date(firstDay);
  while (current <= lastDay) {
    weeks++;
    const dow = current.getDay(); // 0=Sun
    const daysToSun = dow === 0 ? 0 : 7 - dow;
    current.setDate(current.getDate() + daysToSun + 1);
  }
  return Math.max(4, Math.min(6, weeks));
}

/** Get info satu minggu */
export function getWeekInfo(year: number, month: number, weekNumber: number): WeekInfo {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  if (weekNumber === 1) {
    // Week 1: mulai 1 bulan, berakhir Minggu pertama
    const dow = firstDay.getDay();
    const daysToSun = dow === 0 ? 0 : 7 - dow;
    const endDate = new Date(firstDay);
    endDate.setDate(firstDay.getDate() + daysToSun);
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(firstDay);
    startDate.setHours(0, 0, 0, 0);
    return { week: weekNumber, startDate, endDate, budgetStartDate: startDate, budgetEndDate: new Date(endDate) };
  }

  // Week 2+: cari Senin pertama dalam bulan
  const firstMonday = new Date(firstDay);
  const dow = firstDay.getDay();
  const daysToMon = dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow;
  firstMonday.setDate(firstDay.getDate() + daysToMon);

  const startDate = new Date(firstMonday);
  startDate.setDate(firstMonday.getDate() + (weekNumber - 2) * 7);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  // Clamp ke akhir bulan
  if (endDate > lastDay) {
    endDate.setTime(lastDay.getTime());
    endDate.setHours(23, 59, 59, 999);
  }

  let budgetStartDate = new Date(startDate);
  if (budgetStartDate < firstDay) budgetStartDate = new Date(firstDay);
  budgetStartDate.setHours(0, 0, 0, 0);

  return {
    week: weekNumber,
    startDate,
    endDate,
    budgetStartDate,
    budgetEndDate: new Date(endDate),
  };
}

/** Semua week infos untuk satu bulan */
export function getAllWeekInfos(year: number, month: number): WeekInfo[] {
  const count = getWeeksInMonth(year, month);
  return Array.from({ length: count }, (_, i) => getWeekInfo(year, month, i + 1));
}

/** Hitung minggu aktif saat ini (1-based) */
export function getCurrentWeekNumber(year: number, month: number): number {
  const now = new Date();
  if (now.getFullYear() !== year || now.getMonth() + 1 !== month) return 1;
  const infos = getAllWeekInfos(year, month);
  for (let i = infos.length - 1; i >= 0; i--) {
    if (now >= infos[i].startDate) return i + 1;
  }
  return 1;
}
```

---

## Task 2 — Budget Calculations (`_utils/budgetCalculations.ts`)

Port cascade algorithm dari v1. Input: monthly budget + semua weekInfos + spending per minggu per kategori.

```ts
import type { WeekInfo } from "./dateCalculations";

/** Hitung spending sebuah kategori dalam rentang tanggal */
export function calcWeekSpending(
  transactions: { transaction_type: string; category_name: string; amount: number; transaction_date: string }[],
  categoryName: string,
  weekInfo: WeekInfo
): number {
  return transactions
    .filter((t) => {
      if (t.transaction_type !== "spending") return false;
      if (t.category_name.toLowerCase() !== categoryName.toLowerCase()) return false;
      const d = new Date(t.transaction_date);
      return d >= weekInfo.startDate && d <= weekInfo.endDate;
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

/** Cascade: hitung weekly budget untuk satu minggu dengan carry-forward sisa/lebih minggu lalu */
export function calcCascadeWeeklyBudget(
  monthlyBudget: number,
  allWeeks: WeekInfo[],
  targetWeek: number,  // 1-based
  spendingPerWeek: number[]  // spending per minggu, index 0 = week 1
): number {
  const totalDays = allWeeks.reduce((s, w) => {
    return s + Math.floor((w.budgetEndDate.getTime() - w.budgetStartDate.getTime()) / 86400000) + 1;
  }, 0);
  const perDay = monthlyBudget / totalDays;

  const originalBudgets = allWeeks.map((w) => {
    const days = Math.floor((w.budgetEndDate.getTime() - w.budgetStartDate.getTime()) / 86400000) + 1;
    return perDay * days;
  });

  if (targetWeek === 1) return originalBudgets[0];

  // Kumpulkan over/under dari minggu-minggu sebelumnya
  let carryForward = 0;
  for (let i = 0; i < targetWeek - 1; i++) {
    const diff = originalBudgets[i] - spendingPerWeek[i];
    carryForward += diff; // positif = sisa (bonus), negatif = over (penalty)
  }

  // Bagi carry ke minggu-minggu yang tersisa (termasuk targetWeek)
  const remainingWeeks = allWeeks.length - (targetWeek - 1);
  const adjustedBudget = originalBudgets[targetWeek - 1] + carryForward / remainingWeeks;
  return Math.max(0, adjustedBudget);
}

export interface WeeklyCategoryData {
  categoryName: string;
  weeklyBudget: number;
  weeklySpending: number;
  percent: number;
  remaining: number;
}
```

---

## Task 3 — Hook (`_hooks/useWeeklyBudget.ts`)

```ts
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { budgetKeys } from "@/lib/query";
import { getBudgetsAction } from "../actions";
import { getWeeklySpendingAction } from "../actions";
import { getAllWeekInfos, getCurrentWeekNumber } from "../_utils/dateCalculations";
import { calcCascadeWeeklyBudget, calcWeekSpending, type WeeklyCategoryData } from "../_utils/budgetCalculations";

const EATING_CATEGORIES = ["Dining Out", "Food", "Fruits", "Groceries", "Grab Credit"];

export function useWeeklyBudget(year: number, month: number) {
  const weeksInMonth = useMemo(() => getAllWeekInfos(year, month).length, [year, month]);
  const defaultWeek = useMemo(() => getCurrentWeekNumber(year, month), [year, month]);
  const [selectedWeek, setSelectedWeek] = useState(defaultWeek);

  // Monthly budgets (eating only)
  const budgetQuery = useQuery({
    queryKey: budgetKeys.withSpending(year, month),
    queryFn: async () => {
      const res = await getBudgetsAction(year, month);
      if (!res.success) throw new Error(res.message);
      return res.data!.filter((b) => EATING_CATEGORIES.includes(b.category_name));
    },
  });

  // Transactions untuk bulan ini (untuk spending calculation)
  const txQuery = useQuery({
    queryKey: ["weekly-transactions", year, month],
    queryFn: async () => {
      const res = await getWeeklySpendingAction(year, month);
      if (!res.success) throw new Error(res.message);
      return res.data!;
    },
  });

  const weeklyData = useMemo((): WeeklyCategoryData[] => {
    if (!budgetQuery.data || !txQuery.data) return [];
    const allWeeks = getAllWeekInfos(year, month);

    return budgetQuery.data.map((budget) => {
      const spendingPerWeek = allWeeks.map((w) =>
        calcWeekSpending(txQuery.data, budget.category_name, w)
      );
      const weeklyBudget = calcCascadeWeeklyBudget(
        budget.budgeted_amount,
        allWeeks,
        selectedWeek,
        spendingPerWeek
      );
      const weeklySpending = spendingPerWeek[selectedWeek - 1];
      const percent = weeklyBudget > 0 ? (weeklySpending / weeklyBudget) * 100 : 0;
      return {
        categoryName: budget.category_name,
        weeklyBudget,
        weeklySpending,
        percent,
        remaining: weeklyBudget - weeklySpending,
      };
    });
  }, [budgetQuery.data, txQuery.data, year, month, selectedWeek]);

  return {
    budgetQuery,
    txQuery,
    weeklyData,
    selectedWeek,
    setSelectedWeek,
    weeksInMonth,
  };
}
```

---

## Task 4 — Server Action `getWeeklySpendingAction`

Tambah ke `src/app/(app)/budgets/actions.ts`:

```ts
export interface WeeklyTransactionRow {
  transaction_type: string;
  category_name: string;
  amount: number;
  transaction_date: string;
}

export async function getWeeklySpendingAction(
  year: number,
  month: number
): Promise<ServerActionResult<WeeklyTransactionRow[]>> {
  try {
    const user = await requireUser();
    const data = await getTransactionsForWeeklyBudget(user.id, year, month);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat data").message };
  }
}
```

Tambah query `getTransactionsForWeeklyBudget` ke `src/db/queries/budgets.ts`:

```ts
export async function getTransactionsForWeeklyBudget(
  userId: string,
  year: number,
  month: number
): Promise<{ transaction_type: string; category_name: string; amount: number; transaction_date: string }[]> {
  // Extend range: prev month day 1 → next month last day (untuk edge case week 1 dan last week)
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

  const rows = await db
    .select({
      transaction_type: transactions.transaction_type,
      category_name: categories.name,
      amount: sql<number>`${transactions.amount}::numeric`,
      transaction_date: sql<string>`${transactions.transaction_date}::text`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.category_id, categories.id))
    .where(
      and(
        eq(transactions.user_id, userId),
        eq(transactions.transaction_type, "spending"),
        sql`${transactions.transaction_date} >= ${startDate}`,
        sql`${transactions.transaction_date} <= ${endDate}`,
        sql`${transactions.deleted_at} is null`
      )
    );
  return rows;
}
```

---

## Task 5 — Components

### `WeeklyBudgetCard.tsx`

```tsx
"use client";
import { formatCurrency } from "@/lib/helper";
import type { WeeklyCategoryData } from "../_utils/budgetCalculations";

const CATEGORY_ICONS: Record<string, string> = {
  "Dining Out": "🍽️",
  "Food": "🍕",
  "Fruits": "🍎",
  "Groceries": "🛒",
  "Grab Credit": "🚗",
};

const MASK = "Rp •••";

function getColors(pct: number) {
  if (pct > 100) return { bar: "bg-red-500", text: "text-red-600", badge: "bg-red-100 text-red-700" };
  if (pct >= 80) return { bar: "bg-amber-400", text: "text-amber-600", badge: "bg-amber-100 text-amber-700" };
  return { bar: "bg-green-500", text: "text-green-600", badge: "bg-green-100 text-green-700" };
}

interface Props {
  data: WeeklyCategoryData;
  hideBalances: boolean;
}

export function WeeklyBudgetCard({ data, hideBalances }: Props) {
  const colors = getColors(data.percent);
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-xl shrink-0">
          {CATEGORY_ICONS[data.categoryName] || "📦"}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-sm text-gray-800">{data.categoryName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${colors.badge}`}>{data.percent.toFixed(0)}%</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {hideBalances ? MASK : `${formatCurrency(data.weeklySpending)} / ${formatCurrency(data.weeklyBudget)}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${Math.min(data.percent, 100)}%` }} />
        </div>
        <span className={`text-xs font-bold ${colors.text} min-w-[36px] text-right`}>
          {hideBalances ? "•••" : formatCurrency(data.remaining, "short")}
        </span>
      </div>
    </div>
  );
}
```

### `WeeklyOverallCard.tsx`

```tsx
"use client";
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
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500">Budget Minggu Ini</p>
          <p className="font-bold text-gray-900">{hideBalances ? MASK : formatCurrency(totalBudget)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Terpakai</p>
          <p className="font-bold text-gray-900">{hideBalances ? MASK : formatCurrency(totalSpent)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Sisa</p>
          <p className={`font-bold ${remaining < 0 ? "text-red-600" : "text-green-600"}`}>
            {hideBalances ? MASK : formatCurrency(remaining)}
          </p>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${percent > 100 ? "bg-red-500" : percent >= 80 ? "bg-amber-400" : "bg-green-500"}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
```

---

## Task 6 — Page (`src/app/(app)/budgets/weekly/page.tsx`)

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { useWeeklyBudget } from "./_hooks/useWeeklyBudget";
import { WeeklyBudgetCard } from "./_components/WeeklyBudgetCard";
import { WeeklyOverallCard } from "./_components/WeeklyOverallCard";
import { usePrivacyStore } from "@/stores/privacyStore";

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export default function WeeklyBudgetPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const hideBalances = usePrivacyStore((s) => s.hideBalances);

  const { budgetQuery, txQuery, weeklyData, selectedWeek, setSelectedWeek, weeksInMonth } =
    useWeeklyBudget(year, month);

  const isLoading = budgetQuery.isLoading || txQuery.isLoading;

  return (
    <div className="bg-blue-50 min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden bg-linear-to-r from-blue-600 via-blue-700 to-indigo-800 px-4 pt-5 pb-6">
        <div className="absolute bottom-0 left-0 w-full h-8">
          <svg viewBox="0 0 400 32" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,32 Q100,20 200,32 T400,20 L400,32 Z" fill="rgb(239 246 255)" />
          </svg>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              <Link href="/budgets" className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
                <ChevronLeft className="w-6 h-6 text-white" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Weekly Budget</h1>
                <p className="text-blue-100 text-xs">Eating categories</p>
              </div>
            </div>
            {/* Month + Year selectors */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="appearance-none bg-white/20 text-white border border-white/30 rounded-xl px-3 py-1.5 pr-6 text-sm font-semibold focus:outline-none"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1} className="text-gray-900 bg-white">{m}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/80" />
              </div>
              <div className="relative">
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="appearance-none bg-white/20 text-white border border-white/30 rounded-xl px-3 py-1.5 pr-6 text-sm font-semibold focus:outline-none"
                >
                  {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => (
                    <option key={y} value={y} className="text-gray-900 bg-white">{y}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/80" />
              </div>
            </div>
          </div>

          {/* Week selector tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {Array.from({ length: weeksInMonth }, (_, i) => i + 1).map((w) => (
              <button
                key={w}
                onClick={() => setSelectedWeek(w)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  selectedWeek === w
                    ? "bg-white text-blue-700"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                Week {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 pb-24 space-y-3">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="animate-pulse bg-white rounded-2xl h-20 shadow-sm" />)}
          </div>
        )}

        {!isLoading && weeklyData.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <p className="text-gray-400 text-sm">Belum ada budget eating bulan ini.</p>
            <p className="text-gray-400 text-xs mt-1">Set budget di halaman <Link href="/budgets" className="text-blue-500 underline">Budget</Link> dulu.</p>
          </div>
        )}

        {!isLoading && weeklyData.length > 0 && (
          <>
            <WeeklyOverallCard weeklyData={weeklyData} hideBalances={hideBalances} />
            <div className="space-y-2">
              {weeklyData.map((d) => (
                <WeeklyBudgetCard key={d.categoryName} data={d} hideBalances={hideBalances} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

---

## Task 7 — Entry Point di Budgets Page

Tambah link ke weekly budget di `/budgets/page.tsx` header area:

```tsx
// Di header, setelah month/year selectors:
<Link
  href="/budgets/weekly"
  className="flex items-center gap-1 text-xs text-white/80 hover:text-white border border-white/30 rounded-xl px-3 py-1.5 bg-white/10 hover:bg-white/20 transition-all"
>
  <Calendar className="w-3.5 h-3.5" />
  Weekly
</Link>
```

Import `Calendar` dari `lucide-react` + `Link` dari `next/link`.

---

## Verifikasi

```bash
pnpm tsc --noEmit  # 0 errors
pnpm dev
# curl pre-warm: http://localhost:3000/budgets/weekly
```

1. `/budgets/weekly` render header + week tabs (4–6 tabs sesuai bulan)
2. Tab aktif = minggu saat ini (auto-detect)
3. Set budget eating di `/budgets` → weekly menampilkan distribusi proporsional per hari
4. Ada spending → progress bar update, % benar
5. Week 3: spending berlebih di week 2 → weekly budget week 3 berkurang (cascade)
6. `hideBalances` toggle → semua angka tersensor
7. Link "Weekly" di `/budgets` header → navigasi ke `/budgets/weekly`
8. Back button di weekly → balik ke `/budgets`
9. Month/year picker → update data

---

## CLAUDE.md Check
- [ ] Pattern baru? Tidak — pure computation, no new DB tables
- [ ] Tabel baru? Tidak
- [ ] Route baru? `/budgets/weekly` — tidak perlu di BottomNav (akses via link di /budgets)
- [ ] Permission pattern baru? Tidak
