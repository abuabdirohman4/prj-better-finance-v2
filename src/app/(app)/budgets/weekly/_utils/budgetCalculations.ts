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

function getDays(w: WeekInfo): number {
  return Math.floor((w.budgetEndDate.getTime() - w.budgetStartDate.getTime()) / 86400000) + 1;
}

/**
 * Cascade budget algorithm — port exact dari v1 budgetCalculations.js
 *
 * Over/under dari minggu j dibagi proporsional ke hari-hari SETELAH minggu j.
 * Bukan flat carry — tiap minggu sebelumnya berkontribusi penalty/bonus sendiri
 * ke tiap minggu berikutnya, proporsional per hari.
 */
export function calcCascadeWeeklyBudget(
  monthlyBudget: number,
  allWeeks: WeekInfo[],
  targetWeek: number,
  spendingPerWeek: number[]
): number {
  if (!monthlyBudget || allWeeks.length === 0) return 0;

  const totalDays = allWeeks.reduce((s, w) => s + getDays(w), 0);
  const perDay = Math.abs(monthlyBudget) / totalDays;
  const originalBudgets = allWeeks.map((w) => perDay * getDays(w));

  if (targetWeek === 1) return originalBudgets[0];
  if (spendingPerWeek.length === 0) return originalBudgets[targetWeek - 1];

  const overBudgets: number[] = [];
  const underBudgets: number[] = [];

  // Hitung adjusted budget + over/under untuk setiap minggu sebelum targetWeek
  for (let i = 0; i < targetWeek - 1; i++) {
    const weekOriginal = originalBudgets[i];

    let penalty = 0;
    for (let j = 0; j < i; j++) {
      if (overBudgets[j] > 0) {
        const remainingDays = allWeeks.slice(j + 1).reduce((s, w) => s + getDays(w), 0);
        if (remainingDays > 0) {
          penalty += (overBudgets[j] / remainingDays) * getDays(allWeeks[i]);
        }
      }
    }

    let bonus = 0;
    for (let j = 0; j < i; j++) {
      if (underBudgets[j] > 0) {
        const remainingDays = allWeeks.slice(j + 1).reduce((s, w) => s + getDays(w), 0);
        if (remainingDays > 0) {
          bonus += (underBudgets[j] / remainingDays) * getDays(allWeeks[i]);
        }
      }
    }

    const weekAdjusted = Math.max(0, weekOriginal - penalty + bonus);
    const spending = spendingPerWeek[i] ?? 0;
    overBudgets.push(Math.max(0, spending - weekAdjusted));
    underBudgets.push(Math.max(0, weekAdjusted - spending));
  }

  // Hitung adjusted budget untuk targetWeek dari akumulasi over/under minggu sebelumnya
  const targetOriginal = originalBudgets[targetWeek - 1];
  let targetPenalty = 0;
  let targetBonus = 0;

  for (let i = 0; i < overBudgets.length; i++) {
    if (overBudgets[i] > 0) {
      const remainingDays = allWeeks.slice(i + 1).reduce((s, w) => s + getDays(w), 0);
      if (remainingDays > 0) {
        targetPenalty += (overBudgets[i] / remainingDays) * getDays(allWeeks[targetWeek - 1]);
      }
    }
    if (underBudgets[i] > 0) {
      const remainingDays = allWeeks.slice(i + 1).reduce((s, w) => s + getDays(w), 0);
      if (remainingDays > 0) {
        targetBonus += (underBudgets[i] / remainingDays) * getDays(allWeeks[targetWeek - 1]);
      }
    }
  }

  return Math.max(0, targetOriginal - targetPenalty + targetBonus);
}

export interface WeeklyCategoryData {
  categoryName: string;
  weeklyBudget: number;
  weeklySpending: number;
  percent: number;
  remaining: number;
}
