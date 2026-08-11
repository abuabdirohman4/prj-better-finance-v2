CONTEXT:
Saya mengerjakan Better Finance v2 - Next.js 16 + React 19 + TypeScript personal finance app dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md dan @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-08-11-bf-3e0-ar-ap-liability.md

ISSUE: bf-3e0 / AR/AP Liability Proper
BRANCH: feat/bf-3e0-ar-ap-liability

REQUIREMENTS:
1. Ikuti plan task-by-task secara berurutan (Task 1 → 8)
2. Task 1: apply Supabase migration via MCP tool `mcp__better-finance__apply_migration`
3. Setelah Task 1, update `src/db/schema.ts` tambah `is_liability` field
4. Jalankan `npm run build` setelah semua task untuk verifikasi TypeScript
5. Output per task: "✅ Task N complete: [ringkasan]"
6. JANGAN deviate dari plan tanpa approval user

CRITICAL NOTES:
- Task 2 (data migration — mark existing AP accounts): JANGAN jalankan otomatis. Tanya user nama pasti akun AP mereka di DB, lalu jalankan SQL yang sesuai.
- `is_liability=true` accounts: keluar dari `/accounts` list, muncul di `/assets` sebagai section "Liabilities" warna merah
- Net Worth formula: (totalLiquid + totalNonLiquid) - totalLiabilities
- `getDashboardData` totalAssets juga harus kurangi liability
- AccountRow interface harus ada `is_liability` field di semua queries yang select dari accounts

REFERENCE FILES:
- Plan: @docs/plans/2026-08-11-bf-3e0-ar-ap-liability.md
- Rules: @CLAUDE.md + @AGENTS.md
- Schema: @src/db/schema.ts
- Accounts query: @src/db/queries/accounts.ts
- Assets query: @src/db/queries/assets.ts
- Assets page: @src/app/(app)/assets/page.tsx
- Accounts page: @src/app/(app)/accounts/page.tsx
- AccountBottomSheet: @src/app/(app)/accounts/_components/AccountBottomSheet.tsx
- Account schema: @src/lib/schemas/account.ts

Mulai dari Task 1.
