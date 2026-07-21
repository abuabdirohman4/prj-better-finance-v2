CONTEXT:
Saya mengerjakan Better Finance v2 — Next.js 16 + React 19 + Supabase + Drizzle ORM + TanStack Query v5.
App keuangan pribadi, mobile-first (PWA). Accounts CRUD sudah selesai (bf-05n).

CRITICAL: Baca @CLAUDE.md dan @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints.
Key constraints:
- DB tidak RLS-aware — WAJIB filter `where(eq(table.user_id, userId))` di setiap query
- Tailwind v4: pakai `bg-linear-to-{dir}` bukan `bg-gradient-to-{dir}`
- React 19 dynamic route params: pakai `use(params)` bukan destructure langsung
- `numeric` kolom postgres-js → harus `Number()` cast

TASK:
Eksekusi implementation plan di @docs/plans/2026-07-21-bf-23w-balancing.md

ISSUE: bf-23w (no GitHub remote)

REQUIREMENTS:
1. Ikuti plan task-by-task secara berurutan (Task 0 → 1 → 2 → 3 → 4 → 5 → 6)
2. Tidak ada test suite — skip TDD, langsung implementasi
3. Setelah semua task: `npx tsc --noEmit` harus exit 0 (bukan npm run type-check)
4. Output per task: "Task N selesai: [ringkasan]"
5. JANGAN deviate dari plan tanpa approval user

REFERENCE FILES:
- Plan: @docs/plans/2026-07-21-bf-23w-balancing.md
- Schema: @src/db/schema.ts
- Query existing: @src/db/queries/accounts.ts
- Actions existing: @src/app/(app)/accounts/actions.ts
- AccountBottomSheet: @src/app/(app)/accounts/_components/AccountBottomSheet.tsx
- AccountCard: @src/app/(app)/accounts/_components/AccountCard.tsx
- Accounts page: @src/app/(app)/accounts/page.tsx
- accountVisuals: @src/lib/accountVisuals.ts
- helper: @src/lib/helper.ts
- query keys: @src/lib/query.ts

Mulai dari Task 0.
