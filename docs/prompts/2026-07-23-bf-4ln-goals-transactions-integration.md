CONTEXT:
Better Finance v2 — Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, Drizzle ORM, Supabase, TanStack Query v5.

CRITICAL: Baca @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints sebelum mulai. Baca juga @docs/architecture-integration.md dan @docs/konsep-keuangan.md untuk memahami KENAPA fitur ini penting (integrasi transaksi↔goal = fitur pembeda).

TASK:
Eksekusi implementation plan di @docs/plans/2026-07-23-bf-4ln-goals-transactions-integration.md

ISSUE: bf-4ln

REQUIREMENTS:
1. Ikuti plan task-by-task (Task 1 → 7) secara berurutan
2. Jangan commit — user yang commit setelah review
3. Output per task: "✅ Task N complete: [ringkasan singkat]"
4. Jangan deviate dari plan tanpa tanya user dulu
5. Setelah semua task: jalankan `pnpm tsc --noEmit` dan pastikan 0 errors

PENTING — DB SUDAH DISIAPKAN (JANGAN buat migration/ALTER lagi):
- `transactions.goal_id` UUID FK nullable → savings_goals — SUDAH ADA
- Index `idx_transactions_goal_id` — SUDAH ADA
- `savings_goals.goal_type` constraint = ['Saving','Investment'] — SUDAH diubah
- Drizzle schema src/db/schema.ts (transactions.goal_id) — SUDAH ditambah
- Semua ref 'Investing'→'Investment' di kode — SUDAH diganti
Task ini MURNI kode aplikasi. Jangan sentuh DB.

KEY PATTERNS (wajib ikut):
- collected_amount = DERIVED: `savings_goals.collected_amount (opening) + SUM(transactions ter-tag goal_id, type Transfer, deleted_at NULL)`. Compute on-read via subquery, BUKAN kolom cache.
- Transfer UI: dropdown tujuan pakai SingleSelect dengan `group` (optgroup SUDAH didukung di MultiSelect.tsx). Grup "AKUN" + "GOALS". Value prefix: `acc:<id>` / `goal:<id>`.
- Pilih goal → to_account_id = goal.linked_account_id + set goal_id. Balance mutation TETAP (transfer biasa ke akun goal).
- Ownership guard: goal_id yang di-tag WAJIB milik user (cek sebelum insert).
- Server Actions: return ServerActionResult<T>, requireUser(), zod safeParse + issues[0].message.
- Invalidate goalKeys.all setelah create/edit/delete transaksi.

REFERENCE FILES:
- Plan: @docs/plans/2026-07-23-bf-4ln-goals-transactions-integration.md
- AGENTS.md: @AGENTS.md
- Goals query: @src/db/queries/goals.ts
- Transactions actions: @src/app/(app)/transactions/actions.ts
- Transaction form (field to_account): @src/app/(app)/transactions/_components/TransactionForm.tsx
- Bottom sheet: @src/app/(app)/transactions/_components/TransactionBottomSheet.tsx
- SingleSelect (group support): @src/components/ui/MultiSelect.tsx
- Query keys: @src/lib/query.ts
- Schema: @src/db/schema.ts (transactions.goal_id sudah ada)

Mulai dari Task 1.
