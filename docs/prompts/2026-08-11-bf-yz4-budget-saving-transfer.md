CONTEXT:
Saya mengerjakan Better Finance v2 - Next.js 16 + React 19 + TypeScript personal finance app dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md dan @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-08-11-bf-yz4-budget-saving-transfer.md

ISSUE: bf-yz4 / Budget Saving/Transfer
BRANCH: feat/bf-yz4-budget-saving-transfer

REQUIREMENTS:
1. Ikuti plan task-by-task secara berurutan (Task 1 → 5)
2. Tidak ada DB migration — manfaatkan `savings_goals.monthly_contribution` sebagai target
3. Jalankan `npm run build` setelah semua task untuk verifikasi TypeScript
4. Output per task: "✅ Task N complete: [ringkasan]"
5. JANGAN deviate dari plan tanpa approval user

CRITICAL NOTES:
- `getSavingBudgets` ada di `src/db/queries/goals.ts` (bukan budgets.ts) karena query dari `savings_goals` table
- `getSavingBudgetsAction` ada di `src/app/(app)/budgets/actions.ts` (bukan goals/actions.ts) karena ini untuk halaman budget
- Goals dengan `monthly_contribution = null` atau `monthly_contribution = 0` → TIDAK muncul di saving budget section
- Edit target nabung = edit `monthly_contribution` di `/goals` page (tidak ada UI baru)
- Kalau bf-4z1 sudah diimplementasi duluan dan sudah update `useBudgets.ts` + `query.ts`: cukup tambah `savingQuery` dan `budgetKeys.saving` ke yang sudah ada (jangan duplikasi)
- Progress bar saving = biru, makin besar = makin baik

REFERENCE FILES:
- Plan: @docs/plans/2026-08-11-bf-yz4-budget-saving-transfer.md
- Rules: @CLAUDE.md + @AGENTS.md
- Goals query: @src/db/queries/goals.ts (tempat tambah getSavingBudgets)
- Budgets actions: @src/app/(app)/budgets/actions.ts
- Budgets hook: @src/app/(app)/budgets/_hooks/useBudgets.ts
- Budgets page: @src/app/(app)/budgets/page.tsx
- Query keys: @src/lib/query.ts

Mulai dari Task 1.
