"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoryKeys } from "@/lib/query";
import {
  getManageCategoriesAction,
  upsertCategoryAction,
  deleteCategoryAction,
  renameCategoryGroupAction,
} from "../../actions";
import type { UpsertCategoryInput } from "@/lib/schemas/category";

export function useManageCategories() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: categoryKeys.manage(),
    queryFn: async () => {
      const res = await getManageCategoriesAction();
      if (!res.success) throw new Error(res.message ?? "Failed to load categories");
      return res.data!;
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: categoryKeys.all });
  };

  const upsertMutation = useMutation({
    mutationFn: (input: UpsertCategoryInput) => upsertCategoryAction(input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategoryAction(id),
    onSuccess: invalidate,
  });

  const renameGroupMutation = useMutation({
    mutationFn: ({ oldName, newName }: { oldName: string; newName: string }) =>
      renameCategoryGroupAction(oldName, newName),
    onSuccess: invalidate,
  });

  return { query, upsertMutation, deleteMutation, renameGroupMutation };
}
