"use client";

import { useQuery } from "@tanstack/react-query";
import { assetKeys } from "@/lib/query";
import { getAssetsAction } from "../actions";

export function useAssets() {
  return useQuery({
    queryKey: assetKeys.summary(),
    queryFn: async () => {
      const res = await getAssetsAction();
      if (!res.success) throw new Error(res.message);
      return res.data!;
    },
  });
}
