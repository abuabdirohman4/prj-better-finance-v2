# Prompt Antigravity: Landing Page Better Finance

**Issue:** bf-3mb  
**Plan:** `@docs/plans/2026-08-16-bf-3mb-landing-page.md`

---

CONTEXT:
Saya mengerjakan Better Finance — Next.js 16 + React 19 personal finance PWA dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md dan @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints sebelum menulis kode apa pun.

TASK:
Eksekusi implementation plan di @docs/plans/2026-08-16-bf-3mb-landing-page.md

ISSUE: bf-3mb
TIDAK ADA branch khusus (proyek ini tidak pakai GitHub remote aktif).

IMPORTANT NOTES:
1. Bahasa UI landing = Bahasa Indonesia sehari-hari (PENGECUALIAN dari aturan UI-English-first proyek di AGENTS.md — landing page memang harus Indonesia per brief).
2. Warna: JANGAN hijau. Brand = blue/indigo. Palet "Ink & Paper" tercantum detail di plan.
3. Semua klaim di landing = fitur SHIPPED (lihat daftar di AGENTS.md § Feature Pages). JANGAN klaim roadmap.
4. JANGAN ngarang testimoni, avatar, atau angka pengguna.
5. `formatCurrency` dari `src/lib/helper.ts` → pakai untuk semua angka Rp.
6. `Button` dari `src/components/ui/Button.tsx` → pakai untuk semua CTA. Extend className, jangan bikin komponen baru.

REQUIREMENTS:
1. Ikuti plan task-by-task secara berurutan (Task 1 → 8).
2. Task 1 (pindah dashboard) DULU sebelum buat landing — pastikan `/dashboard` jalan.
3. Setelah setiap task: `npm run build` untuk verifikasi (catch import/route errors dini).
4. Task 4: jalankan `npm run test:run` setelah buat `NetWorthDemo.test.ts` — verifikasi PASS.
5. Output per task: "✅ Task N complete: [ringkasan]"
6. JANGAN deviate dari plan tanpa approval user.
7. JANGAN tambah library animasi baru (framer-motion dll) — CSS saja.
8. JANGAN commit/push — user yang eksekusi.

REFERENCE FILES:
- Plan detail: @docs/plans/2026-08-16-bf-3mb-landing-page.md
- Brief kompetitor + positioning: @docs/BRIEF-landing-page-better-finance.md
- Coding rules: @CLAUDE.md + @AGENTS.md
- formatCurrency: @src/lib/helper.ts
- Button component: @src/components/ui/Button.tsx
- App layout (dashboard pattern): @src/app/(app)/page.tsx (SEBELUM dipindah di Task 1)
- Existing layout.tsx (Inter font setup): @src/app/layout.tsx

Mulai dari Task 1 — pindah dashboard `/` → `/dashboard`.
