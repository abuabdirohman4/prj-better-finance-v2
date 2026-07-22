# Prompt: Zod Validation Server Actions (bf-zrl)

CONTEXT:
Better Finance v2 — Next.js 16, Server Actions, zod sudah terpasang tapi 0 dipakai.

CRITICAL: Baca @AGENTS.md untuk semua rules.

TASK:
Eksekusi plan di @docs/plans/2026-07-22-bf-zrl-zod-validation.md

ISSUE: bf-zrl

REQUIREMENTS:
1. Buat 2 schema files: src/lib/schemas/transaction.ts, src/lib/schemas/account.ts
2. Tambah safeParse di createTransactionAction, updateTransactionAction, createAccountAction, updateAccountAction
3. Cek konflik type antara schema inference vs type dari queries/transactions.ts — resolve yang mana source of truth
4. Jangan commit — user yang commit setelah review

REFERENCE FILES:
- Plan: @docs/plans/2026-07-22-bf-zrl-zod-validation.md
- Transactions actions: @src/app/(app)/transactions/actions.ts
- Accounts actions: @src/app/(app)/accounts/actions.ts
- DB types: @src/db/queries/transactions.ts
- errorUtils: @src/lib/errorUtils.ts
