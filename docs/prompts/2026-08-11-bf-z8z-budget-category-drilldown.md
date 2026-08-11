CONTEXT:
Saya mengerjakan prj-better-finance-v2 — Next.js 15 personal finance app dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md dan @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-08-11-bf-z8z-budget-category-drilldown.md

ISSUE: bf-z8z
BRANCH: feat/bf-z8z-budget-category-drilldown

REQUIREMENTS:
1. Ikuti plan task-by-task secara berurutan
2. Setelah semua task: pastikan TypeScript tidak error (check imports, types)
3. Output per task: "Task N complete: [ringkasan]"
4. JANGAN deviate dari plan tanpa approval user

REFERENCE FILES:
- Plan: @docs/plans/2026-08-11-bf-z8z-budget-category-drilldown.md
- Rules: @CLAUDE.md, @AGENTS.md
- Pattern acuan bottom sheet: @src/app/(app)/transactions/_components/TransactionBottomSheet.tsx
- Existing BudgetCard: @src/app/(app)/budgets/_components/BudgetCard.tsx
- Existing BudgetGroup: @src/app/(app)/budgets/_components/BudgetGroup.tsx
- Existing page: @src/app/(app)/budgets/page.tsx
- Existing query: @src/db/queries/budgets.ts
- Schema: @src/db/schema.ts

Mulai dari Task 1.
