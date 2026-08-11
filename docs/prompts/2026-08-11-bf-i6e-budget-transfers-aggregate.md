CONTEXT:
Saya mengerjakan prj-better-finance-v2 — Next.js 15 personal finance app dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md dan @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-08-11-bf-i6e-budget-transfers-aggregate.md

ISSUE: bf-i6e
BRANCH: feat/bf-i6e-budget-transfers-aggregate

REQUIREMENTS:
1. Ikuti plan task-by-task secara berurutan
2. Task 1 (DB): jalankan SQL via MCP tool mcp__better-finance__execute_sql
3. Setelah semua task: pastikan TypeScript tidak error (check imports, types)
4. Output per task: "Task N complete: [ringkasan]"
5. JANGAN deviate dari plan tanpa approval user

REFERENCE FILES:
- Plan: @docs/plans/2026-08-11-bf-i6e-budget-transfers-aggregate.md
- Rules: @CLAUDE.md, @AGENTS.md
- Existing pattern: @src/app/(app)/budgets/_components/SavingBudgetSection.tsx
- Existing query: @src/db/queries/budgets.ts
- Existing action: @src/app/(app)/budgets/actions.ts
- Existing hook: @src/app/(app)/budgets/_hooks/useBudgets.ts
- Schema: @src/db/schema.ts

Mulai dari Task 1.
