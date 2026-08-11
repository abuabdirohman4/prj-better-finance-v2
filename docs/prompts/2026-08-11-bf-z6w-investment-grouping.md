CONTEXT:
Saya mengerjakan Better Finance v2 - Next.js 16 + React 19 + TypeScript personal finance app dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md dan @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-08-11-bf-z6w-investment-grouping.md

ISSUE: bf-z6w / Investment Grouping 2-Level
BRANCH: feat/bf-z6w-investment-grouping

CATATAN: Task 1 (DB migration `investment_group text` di accounts) sudah dieksekusi Claude via MCP pada 2026-08-11. Kolom sudah ada di DB dan `src/db/schema.ts` sudah ter-update. Task 2 (backfill) — Claude jalankan interaktif dgn user. MULAI DARI TASK 3.

REQUIREMENTS:
1. Ikuti plan MULAI DARI TASK 3 (Task 1 migration selesai; Task 2 backfill dihandle Claude/user)
2. Jalankan `npm run build` setelah semua task
3. Output per task: "✅ Task N complete: [ringkasan]"
4. JANGAN deviate dari plan tanpa approval user

CRITICAL NOTES:
- `investment_group` kolom eksplisit (bukan derive dari nama — nama editable)
- Net Worth: group non-liquid assets by investment_group, render InvestmentGroupCard accordion (pattern mirip GoalCategoryCard)
- Picker transaksi: pakai `group` field di SingleSelect options (optgroup) — cek MultiSelect.tsx support field `group`
- InvestmentGroupCard component baru di assets/_components/

REFERENCE FILES:
- Plan: @docs/plans/2026-08-11-bf-z6w-investment-grouping.md
- Accounts query: @src/db/queries/accounts.ts
- Assets query: @src/db/queries/assets.ts
- Account schema: @src/lib/schemas/account.ts
- Assets page: @src/app/(app)/assets/page.tsx
- GoalCategoryCard (pattern ref): @src/app/(app)/goals/_components/GoalCategoryCard.tsx
- MultiSelect: @src/components/ui/MultiSelect.tsx
- TransactionForm: @src/app/(app)/transactions/_components/TransactionForm.tsx

Mulai dari Task 3.
