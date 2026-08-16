CONTEXT:
Saya mengerjakan prj-better-finance-v2 — Next.js 15 personal finance app dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md dan @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-08-16-bf-i6e-savings-section-redesign.md

ISSUE: bf-i6e
BRANCH: main (tidak pakai feature branch)

REQUIREMENTS:
1. Ikuti plan task-by-task secara berurutan (Task 1 → 2 → 3 → 4)
2. Setelah semua task: pastikan TypeScript tidak error (check imports, types)
3. Output per task: "Task N complete: [ringkasan]"
4. JANGAN deviate dari plan tanpa approval user

REFERENCE FILES:
- Plan: @docs/plans/2026-08-16-bf-i6e-savings-section-redesign.md
- Rules: @CLAUDE.md, @AGENTS.md
- Existing goals query: @src/db/queries/goals.ts
- Existing actions: @src/app/(app)/budgets/actions.ts
- Existing hook: @src/app/(app)/budgets/_hooks/useBudgets.ts
- Existing component: @src/app/(app)/budgets/_components/SavingBudgetSection.tsx
- Existing page: @src/app/(app)/budgets/page.tsx

Mulai dari Task 1.
