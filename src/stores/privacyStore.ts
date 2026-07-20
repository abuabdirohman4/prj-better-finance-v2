"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PrivacyState {
  hideBalances: boolean;
  toggleHideBalances: () => void;
  setHideBalances: (hide: boolean) => void;
}

export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set, get) => ({
      hideBalances: false,
      toggleHideBalances: () => set({ hideBalances: !get().hideBalances }),
      setHideBalances: (hide) => set({ hideBalances: hide }),
    }),
    { name: "bf-privacy" }
  )
);
