"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { walletDenominationKeys, accountKeys, dashboardKeys } from "@/lib/query";
import {
  getWalletDenominationsAction,
  upsertWalletDenominationsAction,
} from "../actions";

export function useWalletDenominations(accountId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: walletDenominationKeys.byAccount(accountId),
    queryFn: async () => {
      const res = await getWalletDenominationsAction(accountId);
      if (!res.success) throw new Error(res.message);
      return res.data!;
    },
  });

  const mutation = useMutation({
    mutationFn: (rows: { denomination: number; note_type: string; count: number }[]) =>
      upsertWalletDenominationsAction(accountId, rows),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletDenominationKeys.byAccount(accountId) });
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(accountId) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });

  return { query, mutation };
}
