# Prompt: Balance Math Tests (bf-13q)

CONTEXT:
Better Finance v2 — Next.js 16, Vitest untuk unit test.
DEPENDS ON: bf-ydb harus sudah selesai (server validation).

CRITICAL: Baca @AGENTS.md untuk semua rules.

TASK:
Eksekusi plan di @docs/plans/2026-07-22-bf-13q-balance-math-tests.md

ISSUE: bf-13q

REQUIREMENTS:
1. Extract calcUpdateDeltas ke _lib/balanceDelta.ts
2. Refactor updateTransactionAction pakai pure function itu
3. Tulis Vitest test: 5 test cases (semua harus PASS sebelum done)
4. Run: pnpm vitest run src/app/(app)/transactions/__tests__/balanceMath.test.ts
5. Jangan commit — user yang commit setelah review

REFERENCE FILES:
- Plan: @docs/plans/2026-07-22-bf-13q-balance-math-tests.md
- Target action: @src/app/(app)/transactions/actions.ts
- Vitest config (kalau ada): vite.config.ts / vitest.config.ts
