CONTEXT:
Better Finance v2 — Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, Drizzle ORM, Supabase, TanStack Query v5.

CRITICAL: Baca @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints sebelum mulai.

TASK:
Eksekusi implementation plan di @docs/plans/2026-07-22-bf-ast-assets-feature.md

ISSUE: bf-9v5

REQUIREMENTS:
1. Ikuti plan task-by-task (Task 1 → 5) secara berurutan
2. Jangan commit — user yang commit setelah review
3. Output per task: "✅ Task N complete: [ringkasan singkat]"
4. Jangan deviate dari plan tanpa tanya user dulu
5. Setelah semua task: jalankan `pnpm tsc --noEmit` dan pastikan 0 errors

KEY PATTERNS (wajib ikut):
- Assets = READ ONLY halaman ini. Tidak ada create/edit/delete di /assets — itu di /accounts
- Server Actions: return `ServerActionResult<T>`, pakai `requireUser()`
- Tidak perlu zod schema (read-only, tidak ada user input)
- Tailwind v4: `bg-linear-to-{dir}` bukan `bg-gradient-to-{dir}`
- Privacy: semua angka cek `hideBalances` dari `usePrivacyStore`
- Tidak ada FAB di halaman ini

REFERENCE FILES:
- Plan: @docs/plans/2026-07-22-bf-ast-assets-feature.md
- AGENTS.md: @AGENTS.md
- AccountRow type + getAccountsWithType: @src/db/queries/accounts.ts
- Pattern hook (read-only): @src/app/(app)/transactions/_hooks/useTransactions.ts
- Schema DB: @src/db/schema.ts (section accounts — lihat asset_category, include_in_net_worth)
- Query keys: @src/lib/query.ts (assetKeys sudah ada)
- accountVisuals (untuk icon/color per akun): @src/lib/accountVisuals.ts

Mulai dari Task 1.
