CONTEXT:
Saya mengerjakan Better Finance v2 — Next.js 15 personal finance app dengan Supabase + Drizzle ORM backend. v2 adalah replika v1 (Google Sheets backend) yang fully database-driven.

CRITICAL: Baca @CLAUDE.md dan @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-07-21-bf-mi4-transactions-list-input.md

ISSUE: bf-mi4
BRANCH: feat/bf-mi4-transactions

REQUIREMENTS:
1. Ikuti plan task-by-task secara berurutan (Task 1 → Task 10)
2. Setiap task: tulis kode → verifikasi tidak ada TypeScript error
3. Setelah semua task: `npm run build` harus pass
4. Output per task: "✅ Task N complete: [ringkasan]"
5. JANGAN deviate dari plan tanpa approval user

REFERENCE FILES:
- Plan: @docs/plans/2026-07-21-bf-mi4-transactions-list-input.md
- Rules: @CLAUDE.md + @AGENTS.md
- DB Schema: @src/db/schema.ts
- Query pattern: @src/db/queries/accounts.ts
- Action pattern: @src/app/(app)/accounts/actions.ts
- Hook pattern: @src/app/(app)/accounts/_hooks/useAccounts.ts
- Card pattern: @src/app/(app)/accounts/_components/AccountCard.tsx
- Bottom sheet pattern: @src/app/(app)/accounts/_components/AccountBottomSheet.tsx
- Page pattern: @src/app/(app)/accounts/page.tsx
- Query keys: @src/lib/query.ts

KEY PATTERNS TO FOLLOW:
- All money: numeric(18,2) in DB, cast to Number() in query mapper
- Server actions: "use server" + requireUser() + ServerActionResult<T>
- Client pages: "use client" + useQuery hook calling server action
- Soft delete: set deleted_at, never hard delete transactions
- Privacy: check usePrivacyStore((s) => s.hideBalances) in all balance displays
- Tailwind v4: bg-linear-to-{dir} NOT bg-gradient-to-{dir}

Mulai dari Task 1.
