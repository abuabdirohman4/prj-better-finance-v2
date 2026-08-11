CONTEXT:
Saya mengerjakan Better Finance v2 - Next.js 16 + React 19 + TypeScript personal finance app dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md dan @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-08-11-bf-ayj-budget-period.md

ISSUE: bf-ayj / Budget Period
BRANCH: feat/bf-ayj-budget-period

CATATAN: Task 1 (DB migration `budget_period date` di transactions) sudah dieksekusi Claude via MCP pada 2026-08-11. Kolom sudah ada di DB dan `src/db/schema.ts` sudah ter-update. MULAI DARI TASK 3 (Task 2 backfill opsional — tanya user dulu).

REQUIREMENTS:
1. Ikuti plan MULAI DARI TASK 3 (Task 1 migration selesai; Task 2 backfill opsional)
2. Jalankan `npm run build` setelah semua task
3. Output per task: "✅ Task N complete: [ringkasan]"
4. JANGAN deviate dari plan tanpa approval user

CRITICAL NOTES:
- `budget_period` NULL → fallback ke transaction_date via COALESCE. Transaksi lama tidak berubah perilaku.
- Budget monthly query pakai `COALESCE(budget_period, transaction_date)` untuk penentuan bulan
- Weekly budget TETAP pakai transaction_date (weekly = fisik kas, monthly = alokasi)
- Kalau bf-4z1 (income budget) sudah merge, `getBudgetsWithSpending` sudah punya `type` param — EDIT yang ada, jangan duplikat
- Field form "Alokasi Bulan" = type="month" native, convert ke YYYY-MM-01

REFERENCE FILES:
- Plan: @docs/plans/2026-08-11-bf-ayj-budget-period.md
- Transaction schema: @src/lib/schemas/transaction.ts
- Transactions query: @src/db/queries/transactions.ts
- Budgets query: @src/db/queries/budgets.ts
- TransactionForm: @src/app/(app)/transactions/_components/TransactionForm.tsx

Mulai dari Task 3.
