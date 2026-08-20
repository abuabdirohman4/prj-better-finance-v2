"use client";

import { useQuery } from "@tanstack/react-query";
import { transactionKeys } from "@/lib/query";
import { getTransactionsAction } from "../actions";
import type { TransactionFilters } from "@/db/queries/transactions";

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: async () => {
      const res = await getTransactionsAction(filters);
      if (!res.success) throw new Error(res.message ?? "Failed to load transactions");
      return res.data!;
    },
  });
}
