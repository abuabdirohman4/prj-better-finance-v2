CONTEXT:
Saya mengerjakan Better Finance v2 - Next.js 16 + React 19 + TypeScript personal finance app dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md dan @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-08-11-bf-noo-import-budget-historis.md

ISSUE: bf-noo / Import Budget Historis
BRANCH: feat/bf-noo-import-budget-historis

REQUIREMENTS:
1. Ikuti plan task-by-task (Task 1 → 5). Tidak ada DB migration — import ke tabel budgets existing.
2. Output per task: "✅ Task N complete: [ringkasan]"
3. JANGAN deviate dari plan tanpa approval user

CRITICAL NOTES:
- Script BARU `scripts/import-budget.ts`. Reuse helper (parseCSV, fetchTab, parseNum, normalizeHeader) dari scripts/migrate-sheet.ts — COPY fungsi, jangan refactor migrate-sheet ke shared module (risiko regresi import 2026 yang sudah jalan)
- Ambil kolom `BUDGET <MONTH>` per kategori (regex /^BUDGET\s+(\w{3})/i)
- Upsert ke budgets (onConflictDoUpdate) — idempotent, re-import overwrite
- Category matching: name.toLowerCase() → categories.id map, skip yang tak match (log warning)
- JANGAN jalankan script sendiri (butuh env + boros). User yang run --dry lalu commit, analisa output saja.

REFERENCE FILES:
- Plan: @docs/plans/2026-08-11-bf-noo-import-budget-historis.md
- Migrate script (ref helpers): @scripts/migrate-sheet.ts
- Schema (budgets, categories): @src/db/schema.ts

Mulai dari Task 1.
