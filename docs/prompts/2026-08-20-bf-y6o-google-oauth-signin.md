CONTEXT:
Saya mengerjakan Better Finance v2 - Next.js 16 personal finance app dengan Supabase backend.

CRITICAL: Baca @AGENTS.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-08-20-bf-y6o-google-oauth-signin.md

ISSUE: bf-y6o
BRANCH: feat/bf-y6o-google-oauth

REQUIREMENTS:
1. Ikuti plan task-by-task secara berurutan
2. SKIP bagian migration DB (section 6) — dikerjakan Claude via MCP, bukan executor
3. Jalankan test setelah perubahan: npm run test:run
4. Setelah semua task: npm run build — wajib lolos
5. Output per task: "✅ Task N complete: [ringkasan]"
6. JANGAN deviate dari plan tanpa approval user
7. UI wording English ("Continue with Google") — lihat AGENTS.md English-first rule

REFERENCE FILES:
- Plan: @docs/plans/2026-08-20-bf-y6o-google-oauth-signin.md
- Rules: @AGENTS.md
- Auth files: @src/app/(auth)/signin/actions.ts, @src/app/(auth)/signin/page.tsx, @src/app/(auth)/signup/page.tsx, @src/lib/supabase/middleware.ts, @src/app/auth/callback/route.ts

Mulai dari Task 1.
