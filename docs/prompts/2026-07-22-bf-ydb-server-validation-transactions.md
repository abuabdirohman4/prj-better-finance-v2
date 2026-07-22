# Prompt: Server-Side Validation Transactions (bf-ydb)

CONTEXT:
Better Finance v2 — Next.js 16, Server Actions, Drizzle ORM.

CRITICAL: Baca @AGENTS.md untuk semua rules.

TASK:
Eksekusi plan di @docs/plans/2026-07-22-bf-ydb-server-validation-transactions.md

ISSUE: bf-ydb

REQUIREMENTS:
1. Edit 1 file: src/app/(app)/transactions/actions.ts
2. Tambah guard validation di createTransactionAction dan updateTransactionAction
3. Jangan duplikat deklarasi variabel (newAmount dll sudah ada di updateTransactionAction bawah)
4. Jangan commit — user yang commit setelah review

REFERENCE FILES:
- Plan: @docs/plans/2026-07-22-bf-ydb-server-validation-transactions.md
- Target file: @src/app/(app)/transactions/actions.ts
- errorUtils pattern: @src/lib/errorUtils.ts
