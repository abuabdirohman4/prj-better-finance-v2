CONTEXT:
Saya mengerjakan Better Finance v2 - Next.js 16 + React 19 + TypeScript personal finance app dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md dan @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-08-11-bf-dac-account-detail-page.md

ISSUE: bf-dac / Account Detail Page
BRANCH: feat/bf-dac-account-detail-page

REQUIREMENTS:
1. Ikuti plan task-by-task (Task 1 → 5). Tidak ada DB migration.
2. Jalankan `npm run build` setelah semua task
3. Output per task: "✅ Task N complete: [ringkasan]"
4. JANGAN deviate dari plan tanpa approval user

CRITICAL NOTES:
- `getTransactionsForAccount` filter `account_id OR to_account_id` (transfer masuk = akun jadi destination). `or` sudah di-import di transactions.ts.
- History section ditambah ke `/accounts/[id]` existing (BUKAN route baru). Halaman itu sekarang untuk balancing — history di bawahnya.
- Untuk transfer: cek apakah akun ini source (money out) atau destination (money in) untuk sign +/-
- LiabilityCard (bf-3e0, sudah merged) di /assets → bungkus Link ke /accounts/[id] biar AR/AP bisa dibuka

REFERENCE FILES:
- Plan: @docs/plans/2026-08-11-bf-dac-account-detail-page.md
- Transactions query: @src/db/queries/transactions.ts
- Account detail page: @src/app/(app)/accounts/[id]/page.tsx
- Account detail actions: @src/app/(app)/accounts/[id]/actions.ts
- Assets page: @src/app/(app)/assets/page.tsx

Mulai dari Task 1.
