# Prompt: Auth Callback Route (bf-2v2)

CONTEXT:
Better Finance v2 — Next.js 16, Supabase SSR auth (@supabase/ssr).

CRITICAL: Baca @AGENTS.md untuk semua rules.

TASK:
Eksekusi plan di @docs/plans/2026-07-22-bf-2v2-auth-callback.md

ISSUE: bf-2v2

REQUIREMENTS:
1. Buat 1 file: src/app/auth/callback/route.ts
2. Pakai createClient dari @/lib/supabase/server (bukan client.ts)
3. Jangan commit — user yang commit setelah review

REFERENCE FILES:
- Plan: @docs/plans/2026-07-22-bf-2v2-auth-callback.md
- Supabase server client: @src/lib/supabase/server.ts
- Signup action (lihat emailRedirectTo): @src/app/(auth)/signup/actions.ts
- accessControlServer pattern: @src/lib/accessControlServer.ts
