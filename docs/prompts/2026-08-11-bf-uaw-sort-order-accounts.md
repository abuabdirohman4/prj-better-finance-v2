CONTEXT:
Saya mengerjakan Better Finance v2 - Next.js 16 + React 19 + TypeScript personal finance app dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md dan @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-08-11-bf-uaw-sort-order-accounts.md

ISSUE: bf-uaw / Sort Order Akun
BRANCH: feat/bf-uaw-sort-order-accounts

REQUIREMENTS:
1. Ikuti plan task-by-task (Task 1 → 3, Task 4 opsional). Tidak ada DB migration (sort_order sudah ada).
2. Jalankan `npm run build` setelah semua task
3. Output per task: "✅ Task N complete: [ringkasan]"
4. JANGAN deviate dari plan tanpa approval user

CRITICAL NOTES:
- Pakai ▲▼ up/down buttons, BUKAN drag-and-drop lib (hindari dependency baru). Drag-drop iterate nanti kalau user minta.
- Reorder = swap sort_order 2 akun bersebelahan, reassign sequential 0..n
- Optimistic update via queryClient.setQueryData, lalu invalidate setelah server confirm
- Scope awal: /accounts (liquid) saja. /assets reorder follow nanti.

REFERENCE FILES:
- Plan: @docs/plans/2026-08-11-bf-uaw-sort-order-accounts.md
- Accounts actions: @src/app/(app)/accounts/actions.ts
- Accounts query: @src/db/queries/accounts.ts
- Accounts page: @src/app/(app)/accounts/page.tsx

Mulai dari Task 1.
