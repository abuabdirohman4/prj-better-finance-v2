"use client";

import { useQuery } from "@tanstack/react-query";
import { categoryKeys } from "@/lib/query";
import { getCategoriesAction } from "../actions";

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: async () => {
      const res = await getCategoriesAction();
      if (!res.success) throw new Error(res.message ?? "Gagal memuat kategori");
      return res.data!;
    },
  });
}
