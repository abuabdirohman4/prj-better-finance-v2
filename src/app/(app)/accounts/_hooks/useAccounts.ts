"use client";

import { useQuery } from "@tanstack/react-query";
import { accountKeys } from "@/lib/query";
import { getAccounts } from "../actions";

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.list(),
    queryFn: async () => {
      const res = await getAccounts();
      if (!res.success) throw new Error(res.message ?? "Failed to load accounts");
      return res.data!;
    },
  });
}
