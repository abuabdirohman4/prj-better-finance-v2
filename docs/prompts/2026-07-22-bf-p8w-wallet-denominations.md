# Prompt: Wallet Denominations (bf-p8w)

CONTEXT:
Saya mengerjakan Better Finance v2 — Next.js 16 personal finance app dengan Supabase + Drizzle ORM.

CRITICAL: Baca @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-07-22-bf-p8w-wallet-denominations.md

ISSUE: bf-p8w

REQUIREMENTS:
1. Ikuti plan task-by-task secara berurutan (Task 1 → Task 6)
2. Sebelum mulai Task 3 (Server Actions), grep `getAccountById` di src/db/queries/accounts.ts — pastikan fungsi exist dan return field `is_wallet`. Kalau tidak ada, cari fungsi yang equivalent.
3. Di Task 2 (Drizzle queries), pakai `sql` dari drizzle-orm untuk onConflictDoUpdate: `set: { count: sql\`excluded.count\`, updated_at: sql\`now()\` }`
4. Jangan commit — user yang commit setelah review
5. Output per task: "✅ Task N complete: [ringkasan]"
6. JANGAN deviate dari plan tanpa approval user

REFERENCE FILES:
- Plan: @docs/plans/2026-07-22-bf-p8w-wallet-denominations.md
- Rules: @AGENTS.md
- Schema: @src/db/schema.ts (walletDenominations table, accounts table)
- Query pattern: @src/db/queries/accounts.ts
- Action pattern: @src/app/(app)/accounts/actions.ts
- Hook pattern: @src/app/(app)/accounts/_hooks/useAccounts.ts
- errorUtils: @src/lib/errorUtils.ts
- Query keys: @src/lib/query.ts
- v1 reference (UI): /Users/abuabdirohman/Documents/Programs/Project/prj-better-finance/app/accounts/wallet-fractions/page.js

Mulai dari Task 1.
