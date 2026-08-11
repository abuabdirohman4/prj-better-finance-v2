CONTEXT:
Saya mengerjakan Better Finance v2 - Next.js 16 + React 19 + TypeScript personal finance app dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md dan @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-08-11-bf-btz-goal-usage-ledger.md

ISSUE: bf-btz / Goal Usage Ledger
BRANCH: feat/bf-btz-goal-usage-ledger

REQUIREMENTS:
1. Ikuti plan task-by-task secara berurutan (Task 1 → 7)
2. Tidak ada DB migration — pure query + UI changes
3. Jalankan `npm run build` setelah semua task untuk verifikasi TypeScript
4. Output per task: "✅ Task N complete: [ringkasan]"
5. JANGAN deviate dari plan tanpa approval user

CRITICAL NOTES:
- `getGoals` query update: collected = base + SUM(transfer ber-goal_id) - SUM(spending ber-goal_id). Gunakan 2 leftJoin subquery (sudah ada pattern untuk transfer, tambah yang withdrawal).
- `collected_amount` bisa negatif jika spending > transfer — biarkan nilai asli tersimpan, clamp di 0 hanya untuk display progress bar
- `GoalLedger` component: + = transfer (top-up), - = spending (withdrawal)
- TransactionForm: `goal_id` picker sekarang muncul juga untuk `txType === "spending"`, label "From Goal" (bukan "Untuk Goal")
- `enabled` condition query goals di TransactionForm: update jadi `txType === "transfer" || txType === "spending"`
- GoalCard atau GoalCategoryCard: cek struktur komponen yang sebenarnya dulu sebelum tambah expand. Mungkin GoalCard inline di GoalCategoryCard

REFERENCE FILES:
- Plan: @docs/plans/2026-08-11-bf-btz-goal-usage-ledger.md
- Rules: @CLAUDE.md + @AGENTS.md
- Goals query: @src/db/queries/goals.ts
- Goals actions: @src/app/(app)/goals/actions.ts
- Goals components: @src/app/(app)/goals/_components/
- Goals page: @src/app/(app)/goals/page.tsx
- Transaction form: @src/app/(app)/transactions/_components/TransactionForm.tsx

Mulai dari Task 1.
