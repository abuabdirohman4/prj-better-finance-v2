CONTEXT:
Better Finance v2 — Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, Drizzle ORM, Supabase, TanStack Query v5.

CRITICAL: Baca @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints sebelum mulai.

TASK:
Eksekusi implementation plan di @docs/plans/2026-07-23-bf-9v5-assets-net-worth.md

ISSUE: bf-9v5

REQUIREMENTS:
1. Ikuti plan task-by-task (Task 1 → 4) secara berurutan
2. Jangan commit — user yang commit setelah review
3. Output per task: "✅ Task N complete: [ringkasan singkat]"
4. Jangan deviate dari plan tanpa tanya user dulu
5. Setelah semua task: jalankan `pnpm tsc --noEmit` dan pastikan 0 errors

KEY PATTERNS (wajib ikut):
- FITUR READ-ONLY — tidak ada CRUD, bottom sheet, atau FAB
- Assets = DERIVED dari accounts.current_balance (BUKAN tabel/input manual). Kolom asset_category + include_in_net_worth SUDAH ADA di accounts. Tidak perlu migration.
- Net worth = SUM(liquid) + SUM(non-liquid), hanya akun include_in_net_worth = true
- Numeric dari DB: cast `sql<number>`${accounts.current_balance}::numeric``
- Server Actions: return ServerActionResult<T>, requireUser()
- Privacy: semua angka cek hideBalances dari usePrivacyStore
- Header gradient + wave: copy dari src/app/(app)/page.tsx. Body mulai mt-6.
- Tailwind v4: bg-linear-to-{dir} bukan bg-gradient-to-{dir}

REFERENCE FILES:
- Plan: @docs/plans/2026-07-23-bf-9v5-assets-net-worth.md
- AGENTS.md: @AGENTS.md
- Accounts query (pola + kolom): @src/db/queries/accounts.ts
- Schema: @src/db/schema.ts (accounts: asset_category, include_in_net_worth)
- Query keys: @src/lib/query.ts
- Page pattern + header: @src/app/(app)/page.tsx
- Account visuals: @src/lib/accountVisuals.ts
- Referensi UI v1 (net worth, group liquid/non-liquid): prj-better-finance/components/Card/Asset.js

Mulai dari Task 1.
