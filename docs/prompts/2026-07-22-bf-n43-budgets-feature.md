CONTEXT:
Better Finance v2 — Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, Drizzle ORM, Supabase, TanStack Query v5.

CRITICAL: Baca @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints sebelum mulai.

TASK:
Eksekusi implementation plan di @docs/plans/2026-07-22-bf-bud-budgets-feature.md

ISSUE: bf-n43

REQUIREMENTS:
1. Ikuti plan task-by-task (Task 1 → 7) secara berurutan
2. Jangan commit — user yang commit setelah review
3. Output per task: "✅ Task N complete: [ringkasan singkat]"
4. Jangan deviate dari plan tanpa tanya user dulu
5. Setelah semua task: jalankan `pnpm tsc --noEmit` dan pastikan 0 errors

KEY PATTERNS (wajib ikut):
- Server Actions: return `ServerActionResult<T>` dari `@/lib/errorUtils`, pakai `requireUser()`, zod `safeParse` + `issues[0].message`
- Balance mutations: TIDAK ada di fitur ini (budgets tidak ubah balance)
- Bottom sheet animasi: className fixed + `style={{ transform: open ? "translate(-50%, 0)" : "translate(-50%, 100%)" }}`
- Tailwind v4: `bg-linear-to-{dir}` bukan `bg-gradient-to-{dir}`, `shrink-0` bukan `flex-shrink-0`
- Privacy: semua angka cek `hideBalances` dari `usePrivacyStore`
- FAB: pakai `<Fab>` dari `@/components/layouts/Fab` (bukan inline button)

REFERENCE FILES:
- Plan: @docs/plans/2026-07-22-bf-bud-budgets-feature.md
- AGENTS.md: @AGENTS.md
- Pattern reference Server Action: @src/app/(app)/transactions/actions.ts
- Pattern reference hook: @src/app/(app)/transactions/_hooks/useTransactions.ts
- Pattern reference bottom sheet: @src/app/(app)/transactions/_components/TransactionBottomSheet.tsx
- Existing schema: @src/db/schema.ts (lihat section budgets)
- Query keys: @src/lib/query.ts (budgetKeys sudah ada)
- Fab component: @src/components/layouts/Fab.tsx
- SingleSelect (untuk kategori dropdown): @src/components/ui/MultiSelect.tsx

Mulai dari Task 1.
