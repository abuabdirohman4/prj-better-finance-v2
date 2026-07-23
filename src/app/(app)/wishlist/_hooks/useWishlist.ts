"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wishlistKeys, goalKeys, accountKeys } from "@/lib/query";
import {
  getWishlistAction,
  getAffordabilityAction,
  createWishlistAction,
  updateWishlistAction,
  deleteWishlistAction,
  promoteWishlistToGoalAction,
} from "../actions";
import type { CreateWishlistInput, UpdateWishlistInput } from "@/lib/schemas/wishlist";

export function useWishlist(status: "active" | "purchased" | "cancelled" = "active") {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: wishlistKeys.list(status),
    queryFn: async () => {
      const res = await getWishlistAction(status);
      if (!res.success) throw new Error(res.message);
      return res.data!;
    },
  });

  const affordability = useQuery({
    queryKey: [...accountKeys.all, "liquid-balance"] as const,
    queryFn: async () => {
      const res = await getAffordabilityAction();
      if (!res.success) throw new Error(res.message);
      return res.data!;
    },
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
  }

  const createMutation = useMutation({
    mutationFn: async (input: CreateWishlistInput) => {
      const res = await createWishlistAction(input);
      if (!res.success) throw new Error(res.message);
      return res.data!;
    },
    onSuccess: invalidateAll,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateWishlistInput }) => {
      const res = await updateWishlistAction(id, input);
      if (!res.success) throw new Error(res.message);
    },
    onSuccess: invalidateAll,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteWishlistAction(id);
      if (!res.success) throw new Error(res.message);
    },
    onSuccess: invalidateAll,
  });

  const promoteMutation = useMutation({
    mutationFn: async ({ wishlistId, linkedAccountId }: { wishlistId: string; linkedAccountId: string | null }) => {
      const res = await promoteWishlistToGoalAction(wishlistId, linkedAccountId);
      if (!res.success) throw new Error(res.message);
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.all }); // affordability (freeCash) tergantung goal → refetch
    },
  });

  return { query, affordability, createMutation, updateMutation, deleteMutation, promoteMutation };
}
