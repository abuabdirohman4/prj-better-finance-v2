CONTEXT:
Saya mengerjakan Better Finance v2 - Next.js 16 + React 19 + TypeScript personal finance app dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md dan @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-08-11-bf-4z1-income-budget.md

ISSUE: bf-4z1 / Income Budget
BRANCH: feat/bf-4z1-income-budget

REQUIREMENTS:
1. Ikuti plan task-by-task secara berurutan (Task 1 → 6)
2. Tidak ada DB migration — pure query + UI changes
3. Jalankan `npm run build` setelah semua task untuk verifikasi TypeScript
4. Output per task: "✅ Task N complete: [ringkasan]"
5. JANGAN deviate dari plan tanpa approval user

CRITICAL NOTES:
- `getBudgetsWithSpending` dibuat menerima `type: "spending" | "earning"` param, default tetap "spending" (backward compat)
- Income categories = `group_name === "earning"` di tabel categories
- Spending categories = `group_name !== "earning"`
- Overall Progress Card (existing) hanya untuk expense — filter `group_name !== "earning"` dari totalBudgeted/totalSpent
- IncomeBudgetSection: progress bar hijau, makin besar = makin baik (beda dari expense)
- `budgetKeys` di `src/lib/query.ts` perlu dicek dulu format existing sebelum tambah key baru

REFERENCE FILES:
- Plan: @docs/plans/2026-08-11-bf-4z1-income-budget.md
- Rules: @CLAUDE.md + @AGENTS.md
- Budgets query: @src/db/queries/budgets.ts
- Budgets actions: @src/app/(app)/budgets/actions.ts
- Budgets hook: @src/app/(app)/budgets/_hooks/useBudgets.ts
- Budgets page: @src/app/(app)/budgets/page.tsx
- Query keys: @src/lib/query.ts

Mulai dari Task 1.
