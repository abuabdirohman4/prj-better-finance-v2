CONTEXT:
Better Finance v2 — Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, Drizzle ORM, Supabase, TanStack Query v5.

CRITICAL: Baca @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints sebelum mulai.

TASK:
Eksekusi implementation plan di @docs/plans/2026-07-22-bf-9qc-weekly-budget.md

ISSUE: bf-9qc

REQUIREMENTS:
1. Ikuti plan task-by-task (Task 1 → 7) secara berurutan
2. Jangan commit — user yang commit setelah review
3. Output per task: "✅ Task N complete: [ringkasan singkat]"
4. Jangan deviate dari plan tanpa tanya user dulu
5. Setelah semua task: jalankan `pnpm tsc --noEmit` dan pastikan 0 errors

KEY PATTERNS (wajib ikut):
- Fitur ini READ-ONLY — tidak ada CRUD, tidak ada bottom sheet
- Weekly budget = derived dari monthly budget (tabel `budgets`) + spending dari `transactions`
- Cascade algorithm: sisa/lebih minggu lalu carry forward ke minggu berikutnya (lihat plan Task 2)
- Hanya eating categories: "Dining Out", "Food", "Fruits", "Groceries", "Grab Credit"
- Route: `/budgets/weekly` — akses via link di `/budgets` header (bukan BottomNav)
- Tailwind v4: `bg-linear-to-{dir}` bukan `bg-gradient-to-{dir}`
- Privacy: semua angka cek `hideBalances` dari `usePrivacyStore`
- Server Actions: return `ServerActionResult<T>`, pakai `requireUser()`

REFERENCE FILES:
- Plan: @docs/plans/2026-07-22-bf-9qc-weekly-budget.md
- AGENTS.md: @AGENTS.md
- Existing budgets actions: @src/app/(app)/budgets/actions.ts
- Existing budgets queries: @src/db/queries/budgets.ts
- Pattern hook: @src/app/(app)/budgets/_hooks/useBudgets.ts
- Query keys: @src/lib/query.ts (budgetKeys sudah ada)
- Budgets page (untuk tambah Weekly link): @src/app/(app)/budgets/page.tsx

Mulai dari Task 1.
