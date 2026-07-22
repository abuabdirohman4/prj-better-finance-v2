# Plan: Auth Callback Route (bf-2v2)

**Date:** 2026-07-22
**Issue:** bf-2v2 · P1 Bug
**File baru:** `src/app/auth/callback/route.ts`

## Context

`signUp` action di `src/app/(auth)/signup/actions.ts:29` set `emailRedirectTo: .../auth/callback`.
Route `/auth/callback` **belum ada** → user klik link verify email → 404 → session tidak ter-exchange → tidak bisa masuk.
Fix: 1 file Route Handler GET, exchange code → redirect `/`.

## Task 1 — Buat `src/app/auth/callback/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/signin?message=Email+verification+failed`);
}
```

> Pola `createClient` dari `@/lib/supabase/server` — sama persis yang dipakai di `src/lib/accessControlServer.ts`.

## Verifikasi

1. Signup user baru → cek email
2. Klik link verify → landing di `/` dalam keadaan logged-in (bukan 404)
3. Test negatif: akses `/auth/callback` tanpa `?code` → redirect ke `/signin?message=...`
4. Test negatif: `?code` expired/invalid → redirect ke `/signin?message=...`

## CLAUDE.md Check
- [ ] Route handler pattern baru? Tidak — pola standard Next.js App Router
- [ ] Update docs? Tidak perlu
