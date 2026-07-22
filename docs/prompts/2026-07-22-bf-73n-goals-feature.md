CONTEXT:
Better Finance v2 — Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, Drizzle ORM, Supabase, TanStack Query v5.

CRITICAL: Baca @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints sebelum mulai.

TASK:
Eksekusi implementation plan di @docs/plans/2026-07-22-bf-73n-goals-feature.md

ISSUE: bf-73n

REQUIREMENTS:
1. Ikuti plan task-by-task (Task 1 → 7) secara berurutan
2. Jangan commit — user yang commit setelah review
3. Output per task: "✅ Task N complete: [ringkasan singkat]"
4. Jangan deviate dari plan tanpa tanya user dulu
5. Setelah semua task: jalankan `pnpm tsc --noEmit` dan pastikan 0 errors

KEY PATTERNS (wajib ikut):
- Server Actions: return `ServerActionResult<T>`, pakai `requireUser()`, zod `safeParse` + `issues[0].message`
- Numeric dari DB: WAJIB cast `sql<number>\`...\`::numeric\`` (Drizzle return string untuk numeric columns)
- Bottom sheet animasi: style `transform: open ? "translate(-50%, 0)" : "translate(-50%, 100%)"`, className `fixed bottom-0 left-1/2 w-full max-w-md`
- Tailwind v4: `bg-linear-to-{dir}` bukan `bg-gradient-to-{dir}`, `shrink-0` bukan `flex-shrink-0`
- Privacy: semua angka cek `hideBalances` dari `usePrivacyStore`
- FAB: pakai `<Fab>` dari `@/components/layouts/Fab`
- SingleSelect: dieksport dari `@/components/ui/MultiSelect.tsx`

REFERENCE FILES:
- Plan: @docs/plans/2026-07-22-bf-73n-goals-feature.md
- AGENTS.md: @AGENTS.md
- Pattern Server Action: @src/app/(app)/budgets/actions.ts (setelah budgets selesai) atau @src/app/(app)/transactions/actions.ts
- Pattern hook: @src/app/(app)/transactions/_hooks/useTransactions.ts
- Pattern bottom sheet: @src/app/(app)/transactions/_components/TransactionBottomSheet.tsx
- Schema DB: @src/db/schema.ts (section savings_goals)
- Query keys: @src/lib/query.ts (goalKeys sudah ada)
- Fab: @src/components/layouts/Fab.tsx
- SingleSelect: @src/components/ui/MultiSelect.tsx
- Accounts query (untuk linked_account): @src/db/queries/accounts.ts

Mulai dari Task 1.
