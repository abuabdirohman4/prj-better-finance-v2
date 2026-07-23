CONTEXT:
Better Finance v2 — Next.js 16, Drizzle, Supabase. Fitur analisa keuangan gaya CFP.

CATATAN PENTING — issue ini punya 2 mode, PILIH DULU:

## Mode 1 — On-demand (chat, DEFAULT, TANPA Antigravity)
Tidak perlu prompt ini. Cukup minta Claude langsung di chat:
> "Jadilah CFP saya. Analisa kondisi keuangan saya dari Google Sheet [tahun]. Terapkan metodologi di @docs/plans/2026-07-23-bf-gv5-cfp-analysis.md Bagian A + B."
Claude fetch sheet via gviz, hitung metrik (net worth, saving rate, emergency fund, alokasi, progress goals, spending), beri laporan CFP. Bisa dilakukan kapan saja, tidak butuh coding.

## Mode 2 — Fitur app (`/insights`) — HANYA jika user mau analisa in-app berulang
Gunakan prompt di bawah untuk Antigravity.

---

CONTEXT (mode 2):
CRITICAL: Baca @AGENTS.md + @docs/konsep-keuangan.md + @docs/plans/2026-07-23-bf-gv5-cfp-analysis.md Bagian A & C.

TASK:
Eksekusi Bagian C (fitur app) dari plan @docs/plans/2026-07-23-bf-gv5-cfp-analysis.md

ISSUE: bf-gv5 (mode 2)

PRASYARAT: data keuangan sudah di DB (bf-bwh selesai) supaya ada yang dianalisa.

REQUIREMENTS:
1. Kalkulasi metrik = PURE FUNCTION di `src/lib/cfp/*.ts` (testable) — tulis Vitest per metrik
2. Query agregat di `src/db/queries/insights.ts`
3. LLM call untuk narasi (Gemini `GEMINI_API_KEY` atau Claude API) — hasil di-cache ke tabel `ai_insights` (JANGAN generate tiap load)
4. Jangan commit — user commit setelah review
5. `pnpm tsc --noEmit` + `pnpm test` 0 errors
6. Output per task: "✅ [ringkasan]"

KEY PATTERNS:
- Metodologi metrik: Bagian A plan (net worth, saving rate, emergency fund, alokasi, goals, spending, debt)
- Output format: Bagian B (ringkasan kondisi, kekuatan, kelemahan, rekomendasi actionable, tren)
- Server Actions: ServerActionResult<T>, requireUser()
- Privacy: cek hideBalances
- Cache insight di ai_insights (tabel sudah ada di schema)

REFERENCE FILES:
- Plan: @docs/plans/2026-07-23-bf-gv5-cfp-analysis.md
- Konsep: @docs/konsep-keuangan.md
- Schema (ai_insights): @src/db/schema.ts
- Accounts/transactions/goals queries: @src/db/queries/

CATATAN: Mode 2 = pekerjaan besar (LLM + prompt engineering). Konfirmasi user mau mode 2 SEBELUM mulai. Default cukup mode 1.
