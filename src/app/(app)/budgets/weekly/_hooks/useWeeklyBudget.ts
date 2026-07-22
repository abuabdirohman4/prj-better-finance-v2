"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { budgetKeys } from "@/lib/query";
import { getBudgetsAction } from "../../actions";
import { getWeeklySpendingAction } from "../../actions";
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
