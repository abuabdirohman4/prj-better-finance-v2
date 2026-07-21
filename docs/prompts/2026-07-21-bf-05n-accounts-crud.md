CONTEXT:
Saya mengerjakan Better Finance v2 — Next.js 16 + React 19 + Supabase + Drizzle ORM + TanStack Query v5.
App keuangan pribadi, mobile-first (PWA). Accounts list halaman sudah read-only (selesai).

CRITICAL: Baca @CLAUDE.md dan @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints.
Key constraint: DB tidak RLS-aware — WAJIB filter `where(eq(table.user_id, userId))` di setiap query.

TASK:
Eksekusi implementation plan di @docs/plans/2026-07-21-bf-05n-accounts-crud.md

ISSUE: bf-05n (no GitHub remote)

REQUIREMENTS:
1. Ikuti plan task-by-task secara berurutan (Task 0 → 1 → 2 → 3 → 4 → 5)
2. Tidak ada test suite — skip TDD, langsung implementasi
3. Setelah semua task: `npm run type-check` harus exit 0
4. Output per task: "Task N selesai: [ringkasan]"
5. JANGAN deviate dari plan tanpa approval user

REFERENCE FILES:
- Plan: @docs/plans/2026-07-21-bf-05n-accounts-crud.md
- Schema: @src/db/schema.ts
- Query existing: @src/db/queries/accounts.ts
- Actions existing: @src/app/(app)/accounts/actions.ts
- AccountCard existing: @src/app/(app)/accounts/_components/AccountCard.tsx
- Accounts page: @src/app/(app)/accounts/page.tsx
- Error utils: @src/lib/errorUtils.ts
- Query keys: @src/lib/query.ts

Mulai dari Task 0.
