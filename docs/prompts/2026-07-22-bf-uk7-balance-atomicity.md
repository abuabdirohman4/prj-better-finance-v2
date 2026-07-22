# Prompt: Balance Write Atomicity (bf-uk7)

CONTEXT:
Better Finance v2 — Next.js 16, Supabase Postgres, pgBouncer transaction mode blokir BEGIN/SAVEPOINT.

CRITICAL: Baca @AGENTS.md untuk semua rules.

TASK:
Eksekusi plan di @docs/plans/2026-07-22-bf-uk7-balance-atomicity.md

ISSUE: bf-uk7

REQUIREMENTS:
1. Buat SQL function via Supabase MCP (mcp__better-finance__execute_sql)
2. Tambah helper applyTransactionBalancesRpc di src/db/queries/accounts.ts
3. Refactor 3 actions (create/update/delete) di src/app/(app)/transactions/actions.ts
4. Jangan commit — user yang commit setelah review

REFERENCE FILES:
- Plan: @docs/plans/2026-07-22-bf-uk7-balance-atomicity.md
- Transactions actions: @src/app/(app)/transactions/actions.ts
- Accounts queries: @src/db/queries/accounts.ts
- Supabase server client: @src/lib/supabase/server.ts
