CONTEXT:
Better Finance v2 — Next.js 16 App Router, React 19, TypeScript strict, Drizzle ORM, Supabase Postgres.

CRITICAL: Baca @AGENTS.md untuk coding rules. WAJIB baca @docs/konsep-keuangan.md untuk paham struktur data sheet (double-entry, kolom bucket).

TASK:
Eksekusi implementation plan di @docs/plans/2026-07-23-bf-bwh-migrate-sheet-2025-2026.md

ISSUE: bf-bwh

PRASYARAT: bf-4ln HARUS selesai dulu (transactions.goal_id sudah ada). Konfirmasi ke user sebelum mulai.

REQUIREMENTS:
1. Ikuti plan task-by-task (Task 1 → 5)
2. Jangan commit — user yang commit setelah review
3. Output per task: "✅ Task N complete: [ringkasan]"
4. Jangan deviate tanpa tanya user
5. WAJIB mode dry-run (`--dry`) dulu sebelum insert real ke DB
6. Setelah semua task: `pnpm tsc --noEmit` 0 errors

KEY PATTERNS (wajib ikut):
- Migrasi = SCRIPT one-off `scripts/migrate-sheet.ts` (`pnpm tsx scripts/migrate-sheet.ts <year> [--dry]`), BUKAN fitur/route app
- Idempotent via `import_row_hash` (kolom SUDAH ada) — cek existing sebelum insert
- Fetch sheet: gviz endpoint `https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:csv&sheet=<Tab>`. SHEET_ID 2026 di plan; 2025 tanya user
- Balance: JANGAN RPC per-row. Set current_balance dari Summary sheet ATAU recompute SUM setelah semua insert
- Kolom equity/liability (OI/RE/NET/AP/NP) JANGAN dipaksa masuk — fokus kas + Saving/Investment
- Mulai 2026 dulu, verifikasi vs Summary sheet, baru 2025
- Backup DB / pakai Supabase branch sebelum run non-dry

REFERENCE FILES:
- Plan: @docs/plans/2026-07-23-bf-bwh-migrate-sheet-2025-2026.md
- Konsep sheet: @docs/konsep-keuangan.md
- Schema (transactions, accounts, categories, savings_goals): @src/db/schema.ts
- DB client: @src/db/index.ts
- Transactions query (pola insert): @src/db/queries/transactions.ts

Mulai dari Task 1 (dry-run dulu).
