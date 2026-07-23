CONTEXT:
Better Finance v2 — Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, Drizzle ORM, Supabase, TanStack Query v5.

CRITICAL: Baca @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints sebelum mulai.

TASK:
Eksekusi implementation plan di @docs/plans/2026-07-22-bf-ez2-wishlist-feature.md

ISSUE: bf-ez2

REQUIREMENTS:
1. Ikuti plan task-by-task (Task 1 → 8) secara berurutan
2. Jangan commit — user yang commit setelah review
3. Output per task: "✅ Task N complete: [ringkasan singkat]"
4. Jangan deviate dari plan tanpa tanya user dulu
5. Setelah semua task: jalankan `pnpm tsc --noEmit` dan pastikan 0 errors

KEY PATTERNS (wajib ikut):
- Server Actions: return `ServerActionResult<T>`, pakai `requireUser()`, zod `safeParse` + `issues[0].message`
- Numeric dari DB: WAJIB cast `sql<number>\`...\`::numeric\`` untuk kolom `estimated_price`
- Bottom sheet animasi: style `transform: open ? "translate(-50%, 0)" : "translate(-50%, 100%)"`, className `fixed bottom-0 left-1/2 w-full max-w-md`
- Tailwind v4: `bg-linear-to-{dir}` bukan `bg-gradient-to-{dir}`
- Privacy: semua angka (harga, balance) cek `hideBalances` dari `usePrivacyStore`
- FAB: pakai `<Fab>` dari `@/components/layouts/Fab`
- Affordability: ambil liquid balance dari `getAccountsWithType` filter `asset_category === "liquid"`
- TASK 8 (promote wishlist→goal): buat savings_goals dari wishlist + set wishlists.linked_goal_id. goal_type="Saving", target=estimated_price. Skema linked_goal_id SUDAH ADA. Baca @docs/konsep-keuangan.md §5 untuk konsep wishlist≠goal.

REFERENCE FILES:
- Plan: @docs/plans/2026-07-22-bf-ez2-wishlist-feature.md
- AGENTS.md: @AGENTS.md
- Pattern Server Action: @src/app/(app)/transactions/actions.ts
- Pattern bottom sheet: @src/app/(app)/transactions/_components/TransactionBottomSheet.tsx
- Schema DB: @src/db/schema.ts (section wishlists — linked_goal_id sudah ada)
- Konsep wishlist vs goal: @docs/konsep-keuangan.md §5
- Query keys: @src/lib/query.ts (wishlistKeys sudah ada)
- Accounts query (liquid balance): @src/db/queries/accounts.ts

Mulai dari Task 1.
