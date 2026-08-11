CONTEXT:
Saya mengerjakan Better Finance v2 - Next.js 16 + React 19 + TypeScript personal finance app dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md dan @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-08-11-bf-3ai-investment-tracker.md

ISSUE: bf-3ai / Investment Tracker
BRANCH: feat/bf-3ai-investment-tracker

CATATAN: Task 1 (DB migration `current_value` + `last_valued_at` di accounts) sudah dieksekusi Claude via MCP pada 2026-08-11. Kolom sudah ada di DB dan `src/db/schema.ts` sudah ter-update. MULAI DARI TASK 2.

PRASYARAT: bf-z6w (investment_group) harus SELESAI dulu — tracker view pakai grouping.

REQUIREMENTS:
1. Ikuti plan MULAI DARI TASK 2 (Task 1 migration selesai)
2. Jalankan `npm run build` setelah semua task
3. Output per task: "✅ Task N complete: [ringkasan]"
4. JANGAN deviate dari plan tanpa approval user

CRITICAL NOTES:
- `current_balance` = modal (cost basis). `current_value` = nilai pasar (manual input). P&L = current_value - current_balance.
- Net Worth non-liquid: pakai `current_value ?? current_balance` (nilai pasar kalau ada, kalau tidak modal)
- current_value NULL = belum diinput → P&L 0, pakai modal untuk net worth
- MarketValueCard hanya render untuk akun asset_category === "investment"
- DEFER (YAGNI): tabel investment_holdings multi-lot, emas berat/karat, auto-fetch harga. Jangan buat kecuali user minta.

REFERENCE FILES:
- Plan: @docs/plans/2026-08-11-bf-3ai-investment-tracker.md
- Assets query: @src/db/queries/assets.ts
- Account schema: @src/lib/schemas/account.ts
- Accounts query: @src/db/queries/accounts.ts
- Account detail page: @src/app/(app)/accounts/[id]/page.tsx
- Assets page: @src/app/(app)/assets/page.tsx

Mulai dari Task 2.
