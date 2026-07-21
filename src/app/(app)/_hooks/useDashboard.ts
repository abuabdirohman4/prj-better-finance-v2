"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../actions";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await getDashboard();
      if (!res.success) throw new Error(res.message ?? "Gagal memuat dashboard");
      return res.data!;
    },
  });
}
