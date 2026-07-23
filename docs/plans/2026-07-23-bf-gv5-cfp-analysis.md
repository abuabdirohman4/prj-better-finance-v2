# Plan: CFP Financial Analysis + Insights (bf-gv5)

**Date:** 2026-07-23
**Issue:** bf-gv5 · P3 Feature
**Scope:** Analisa keuangan gaya CFP (Certified Financial Planner) — nilai kondisi, tren, saran, kritik.

---

## Context

User ingin AI berperan CFP: evaluasi cara mengelola keuangan (2020-2026 di sheet), beri saran ke depan. Baca `docs/konsep-keuangan.md` untuk paham data.

**2 mode analisa (beda tujuan):**
1. **On-demand (chat)** — Claude fetch data dari sheet/DB, analisa dalam percakapan. TIDAK butuh fitur app. Bisa sekarang.
2. **In-app (fitur)** — halaman `/insights` yang generate analisa otomatis dari DB. Butuh data di DB (bf-bwh selesai) + tabel `ai_insights` (sudah ada di schema).

**Keputusan:** mulai dari **mode 1 (on-demand)** — tidak perlu coding. Mode 2 (fitur app) opsional, dibuat kalau user mau analisa berulang dalam app.

---

## Bagian A — Metodologi Analisa CFP (dipakai mode 1 & 2)

Metrik yang dihitung + dinilai:

### 1. Net Worth & Tren
- Net worth = total aset (liquid + non-liquid) - liabilitas (AP + NP).
- Tren per bulan/tahun (naik/turun/stagnan). Sumber: Summary/Assets sheet per periode.

### 2. Saving Rate
- `(pemasukan - pengeluaran) / pemasukan` per bulan.
- Benchmark CFP: ≥20% sehat, ≥30% agresif. Nilai vs benchmark.

### 3. Emergency Fund Adequacy
- Dana darurat (goal "Dana Darurat" + "Emergency Jago") vs pengeluaran bulanan.
- Benchmark: 3-6x pengeluaran bulanan (single), 6-12x (punya tanggungan).

### 4. Alokasi Aset (liquid vs non-liquid)
- Rasio liquid : non-liquid. Terlalu banyak liquid = idle money; terlalu sedikit = tak siap darurat.

### 5. Progress Goals
- % tiap goal, mana yang behind/on-track/ahead. Goal deadline dekat tapi progress rendah = warning.

### 6. Pola Spending per Kategori
- Kategori terbesar, tren naik. Deteksi lifestyle inflation, kategori bocor.

### 7. Debt (jika ada AP/NP)
- Rasio utang vs aset. Debt-to-asset ratio.

---

## Bagian B — Output Analisa

Format laporan CFP (untuk mode 1, langsung di chat):
1. **Ringkasan kondisi** — 1 paragraf: sehat/perlu perhatian/kritis.
2. **Kekuatan** — apa yang sudah bagus (mis. saving rate tinggi, dana darurat cukup).
3. **Kelemahan/risiko** — apa yang bahaya (mis. alokasi timpang, goal terbengkalai).
4. **Rekomendasi actionable** — langkah konkret prioritas (bukan generic).
5. **Tren** — arah 6-12 bulan terakhir.

---

## Bagian C — Mode 2 (fitur app, OPSIONAL — kerjakan jika user mau)

Kalau dibuat sebagai fitur:

- Route `/insights`.
- Query agregat dari DB (`src/db/queries/insights.ts`): net worth, saving rate, dll dari metodologi Bagian A.
- Kalkulasi pure function di `src/lib/cfp/*.ts` (testable, Vitest).
- LLM call (Gemini — `GEMINI_API_KEY` ada di v1, atau Claude API) untuk narasi saran dari metrik. Simpan hasil ke `ai_insights`.
- UI: kartu skor + rekomendasi. Cache ke `ai_insights` (jangan generate tiap load).

> Mode 2 = pekerjaan besar (LLM integration + prompt engineering). JANGAN kerjakan tanpa konfirmasi user. Default: mode 1 cukup.

---

## Rekomendasi eksekusi

- **Sekarang/segera:** mode 1 — user minta Claude "analisa keuangan saya" di chat, Claude fetch sheet + terapkan Bagian A/B. Tidak perlu Antigravity.
- **Nanti (opsional):** mode 2 sebagai fitur, hanya jika user mau analisa in-app berulang.

Prompt Antigravity HANYA relevan kalau mode 2 dipilih. Untuk mode 1, cukup panggil Claude langsung.

---

## CLAUDE.md Check
- [ ] Jika mode 2 dibuat: pattern LLM insight + `ai_insights` cache — dokumentasikan.
