"use client";

// Client-safe access control — TIDAK boleh import dari accessControlServer.ts
// Hanya gunakan data yang sudah ada di client (session/user profile)

export type UserPlanTier = "free" | "pro" | "family";

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  plan_tier: UserPlanTier;
  onboarding_completed: boolean;
}

export function isPro(tier: UserPlanTier): boolean {
  return tier === "pro" || tier === "family";
}

export function isFree(tier: UserPlanTier): boolean {
  return tier === "free";
}

export const FREE_TIER_LIMITS = {
  maxAccounts: 5,
  maxTransactionsPerMonth: 50,
} as const;
