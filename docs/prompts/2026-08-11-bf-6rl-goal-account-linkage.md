CONTEXT:
Saya mengerjakan Better Finance v2 - Next.js 16 + React 19 + TypeScript personal finance app dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md dan @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-08-11-bf-6rl-goal-account-linkage.md

ISSUE: bf-6rl / Goal Account Linkage
BRANCH: feat/bf-6rl-goal-account-linkage

CATATAN: Task 1 (DB migration `account_id` FK di savings_goals) sudah dieksekusi Claude via MCP pada 2026-08-11. Kolom sudah ada di DB dan `src/db/schema.ts` sudah ter-update. MULAI DARI TASK 2.

REQUIREMENTS:
1. Ikuti plan task-by-task MULAI DARI TASK 2 (Task 1 migration sudah selesai)
2. Jalankan `npm run build` setelah semua task
3. Output per task: "✅ Task N complete: [ringkasan]"
4. JANGAN deviate dari plan tanpa approval user

CRITICAL NOTES:
- `getGoals` leftJoin accounts untuk account_name. `GoalSelectRow` juga butuh account_id (dipakai transfer pre-fill).
- Ownership guard: kalau account_id diisi, validasi getAccountById milik user
- TransactionForm: pilih goal → auto-set to_account_id dari goal.account_id, HANYA kalau user belum set manual (jangan override pilihan user)
- GoalBottomSheet butuh daftar akun — import getAccounts dari accounts/actions

REFERENCE FILES:
- Plan: @docs/plans/2026-08-11-bf-6rl-goal-account-linkage.md
- Goals query: @src/db/queries/goals.ts
- Goals actions: @src/app/(app)/goals/actions.ts
- Goal schema: @src/lib/schemas/goal.ts
- GoalBottomSheet: @src/app/(app)/goals/_components/GoalBottomSheet.tsx
- GoalCard: @src/app/(app)/goals/_components/GoalCard.tsx
- TransactionForm: @src/app/(app)/transactions/_components/TransactionForm.tsx

Mulai dari Task 2.
