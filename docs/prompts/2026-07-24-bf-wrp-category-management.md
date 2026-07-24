CONTEXT:
Saya mengerjakan Better Finance v2 — Next.js (breaking-change version, baca node_modules/next/dist/docs/ bila perlu) + Drizzle + Supabase + TanStack Query + Tailwind v4.

CRITICAL: Baca @AGENTS.md dan @CLAUDE.md untuk SEMUA coding rules, patterns, dan constraints. Terutama:
- Server Actions return ServerActionResult<T>, wrap handleApiError(e, "context")
- Query WAJIB filter where(eq(table.user_id, userId))
- Validasi WAJIB di server (form bisa di-bypass)
- Wording UI English-first
- Tailwind v4: bg-linear-to-*, shrink-0

TASK:
Eksekusi implementation plan di @docs/plans/2026-07-24-bf-wrp-category-management.md

ISSUE: bf-wrp (no GH remote di project ini)

REQUIREMENTS:
1. Ikuti plan task-by-task berurutan (Task 1 → 9)
2. TDD di Task 1 (slug util): RED → GREEN
3. Jalankan test: npm run test:run -- slug (Task 1)
4. Jangan lanjut kalau test FAIL
5. Setelah semua task kode: npm run build (WAJIB lolos — satu-satunya cara catch typo query/import)
6. Output per task: "✅ Task N complete: [ringkasan]"
7. JANGAN deviate dari plan tanpa approval user
8. Commit per task sesuai template di plan
9. Jangan git push — user yang push

REFERENCE FILES:
- Plan: @docs/plans/2026-07-24-bf-wrp-category-management.md
- Design: @docs/plans/2026-07-24-bf-wrp-category-management-design.md
- Rules: @AGENTS.md @CLAUDE.md
- Pola bottom sheet: @src/app/(app)/budgets/_components/BudgetBottomSheet.tsx
- Pola actions: @src/app/(app)/budgets/actions.ts
- Pola page: @src/app/(app)/budgets/page.tsx
- Schema categories: @src/db/schema.ts (baris ~104)

Mulai dari Task 1.
