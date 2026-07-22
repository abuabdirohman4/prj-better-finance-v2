CONTEXT:
Better Finance v2 — Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, Drizzle ORM, Supabase, TanStack Query v5.

CRITICAL: Baca @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints sebelum mulai.

TASK:
Eksekusi implementation plan di @docs/plans/2026-07-22-bf-set-settings-feature.md

ISSUE: bf-9vf

REQUIREMENTS:
1. Ikuti plan task-by-task (Task 1 → 5) secara berurutan
2. Jangan commit — user yang commit setelah review
3. Output per task: "✅ Task N complete: [ringkasan singkat]"
4. Jangan deviate dari plan tanpa tanya user dulu
5. Setelah semua task: jalankan `pnpm tsc --noEmit` dan pastikan 0 errors
6. PERHATIAN: cek `src/stores/privacyStore.ts` — jika belum pakai Zustand persist middleware, tambah persist ke localStorage

KEY PATTERNS (wajib ikut):
- Server Actions: return `ServerActionResult<T>`, pakai `requireUser()`, zod `safeParse` + `issues[0].message`
- Tidak ada FAB, tidak ada bottom sheet — edit nama inline di halaman
- Sign out: `(await createClient()).auth.signOut()` lalu `router.push("/signin")`
- Tailwind v4: `bg-linear-to-{dir}` bukan `bg-gradient-to-{dir}`
- Privacy toggle: pakai `usePrivacyStore` dari `@/stores/privacyStore.ts`

REFERENCE FILES:
- Plan: @docs/plans/2026-07-22-bf-set-settings-feature.md
- AGENTS.md: @AGENTS.md
- privacyStore: @src/stores/privacyStore.ts
- Supabase client (untuk signOut): @src/lib/supabase/client.ts
- Schema DB: @src/db/schema.ts (section user_profiles)
- Pattern Server Action: @src/app/(app)/accounts/actions.ts

Mulai dari Task 1.
