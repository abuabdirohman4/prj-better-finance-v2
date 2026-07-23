# Plan: Settings Feature (bf-9vf)

**Date:** 2026-07-22
**Issue:** bf-9vf · P3 Feature
**Route:** `/settings`
**Scope:** User profile display + privacy preference + app info

---

## Context

Schema `user_profiles`:
```
id, display_name, email, avatar_url, plan_tier ("free"|"pro"|"family"),
plan_expires_at, stripe_customer_id, currency_code ("IDR"), locale ("id-ID"),
timezone ("Asia/Jakarta"), onboarding_completed, created_at, updated_at
```

v1 Settings = halaman admin kustom (sembunyikan/tampilkan goals & budgets per item via cookies). Di v2 scope lebih sederhana: profil user + privacy toggle (sudah ada di Zustand, perlu persist ke localStorage atau user_profiles) + app version info.

**Tidak perlu RHF** — hanya 2-3 field editable (display_name + avatar_url optional).

---

## Files

```
src/db/queries/settings.ts                         ← NEW
src/lib/schemas/settings.ts                        ← NEW
src/app/(app)/settings/actions.ts                  ← NEW
src/app/(app)/settings/_hooks/useSettings.ts       ← NEW
src/app/(app)/settings/page.tsx                    ← REPLACE stub
```

---

## Task 1 — Query (`src/db/queries/settings.ts`)

```ts
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";

export interface UserProfileRow {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  plan_tier: string;
  currency_code: string;
  locale: string;
  timezone: string;
}

export async function getUserProfile(userId: string): Promise<UserProfileRow | null> {
  const rows = await db
    .select({
      id: userProfiles.id,
      display_name: userProfiles.display_name,
      email: userProfiles.email,
      avatar_url: userProfiles.avatar_url,
      plan_tier: userProfiles.plan_tier,
      currency_code: userProfiles.currency_code,
      locale: userProfiles.locale,
      timezone: userProfiles.timezone,
    })
    .from(userProfiles)
    .where(eq(userProfiles.id, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateUserProfile(
  userId: string,
  input: { display_name?: string | null; avatar_url?: string | null }
): Promise<void> {
  await db
    .update(userProfiles)
    .set({ ...input, updated_at: sql`now()` })
    .where(eq(userProfiles.id, userId));
}
```

Import `sql` dari `drizzle-orm`.

---

## Task 2 — Zod Schema (`src/lib/schemas/settings.ts`)

```ts
import { z } from "zod";

export const updateProfileSchema = z.object({
  display_name: z.string().min(1, "Nama wajib diisi").max(50).optional().nullable(),
  avatar_url: z.string().url("URL tidak valid").optional().nullable().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
```

---

## Task 3 — Server Actions (`src/app/(app)/settings/actions.ts`)

```ts
"use server";
import { requireUser } from "@/lib/accessControlServer";
import { handleApiError, type ServerActionResult } from "@/lib/errorUtils";
import { getUserProfile, updateUserProfile, type UserProfileRow } from "@/db/queries/settings";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/schemas/settings";

export async function getProfileAction(): Promise<ServerActionResult<UserProfileRow>> {
  try {
    const user = await requireUser();
    const data = await getUserProfile(user.id);
    if (!data) return { success: false, message: "Profil tidak ditemukan." };
    return { success: true, data };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memuat profil").message };
  }
}

export async function updateProfileAction(
  input: UpdateProfileInput
): Promise<ServerActionResult<void>> {
  try {
    const user = await requireUser();
    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: parsed.error.issues[0].message };
    await updateUserProfile(user.id, parsed.data);
    return { success: true };
  } catch (error) {
    return { success: false, message: handleApiError(error, "memperbarui profil").message };
  }
}
```

---

## Task 4 — Hook (`src/app/(app)/settings/_hooks/useSettings.ts`)

```ts
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfileAction, updateProfileAction } from "../actions";
import type { UpdateProfileInput } from "@/lib/schemas/settings";

const PROFILE_KEY = ["settings", "profile"] as const;

export function useSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: async () => {
      const res = await getProfileAction();
      if (!res.success) throw new Error(res.message);
      return res.data!;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfileAction(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROFILE_KEY }),
  });

  return { query, updateMutation };
}
```

---

## Task 5 — Page (`src/app/(app)/settings/page.tsx`)

Sections:

**Profil:**
- Avatar: inisial atau avatar_url jika ada
- Nama (editable inline — tap → input muncul → save on blur/Enter)
- Email (read-only)
- Plan tier badge (free/pro/family)

**Privasi:**
- Toggle "Sembunyikan Saldo" — pakai `usePrivacyStore` (sudah ada, persist ke localStorage via Zustand persist middleware)

**App:**
- Version info (static string "v2.0.0-beta")
- Link ke `/` (home)

**Sign out:**
- Button "Keluar" → `createClient().auth.signOut()` → `router.push("/signin")`

Tidak pakai FAB. Tidak pakai Bottom sheet — edit nama inline.

**Task 6 — Un-hide menu Settings di BottomNav:**
`src/components/layouts/BottomNav.tsx` — menu `/settings` di-comment saat fitur belum jadi. Aktifkan kembali:
- Uncomment baris `{ href: "/settings", label: "Setelan", icon: Settings }`
- Tambah balik import `Settings` dari lucide-react (`import { Home, ArrowLeftRight, PieChart, Target, Settings } from "lucide-react"`)

---

## Verifikasi

1. `/settings` render profil user dari DB
2. Edit nama → save → nama update di header dashboard
3. Privacy toggle → saldo tersensor di halaman lain
4. Sign out → redirect ke `/signin`

## CLAUDE.md Check
- [ ] `usePrivacyStore` persist: cek apakah sudah pakai `zustand/middleware persist` atau masih in-memory. Jika in-memory, tambah persist ke localStorage di `src/stores/privacyStore.ts`
- [ ] Tidak ada pattern baru di AGENTS.md
