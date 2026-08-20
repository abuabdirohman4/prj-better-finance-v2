# Google OAuth Sign In/Sign Up — Better Finance v2

## Context

App saat ini auth email/password saja (`signInWithPassword`/`signUp`). User mau bisa sign up + sign in pakai Google account. Infra sudah 90% siap: `@supabase/ssr` PKCE flow terpasang, `/auth/callback` route sudah `exchangeCodeForSession` (dipakai email verification) — Google OAuth pakai callback yang sama. Sign-up via Google otomatis (OAuth user baru = user baru; trigger `handle_new_user` di DB bikin row `user_profiles`).

Temuan penting dari eksplorasi:
1. **Middleware blocker**: `src/lib/supabase/middleware.ts:30` redirect semua path tanpa session ke `/signin` KECUALI `/signin`/`/signup`. `/auth/callback` TIDAK di-allowlist → request callback (belum ada session) ke-redirect sebelum `code` ditukar → OAuth gagal. Wajib allowlist.
2. **Trigger drop avatar**: trigger `handle_new_user` (live DB, tidak ada di repo) hanya copy `email` + `display_name`. Google kirim `avatar_url` di `raw_user_meta_data` — kolom `user_profiles.avatar_url` sudah ada tapi tidak diisi. Update trigger via migration.
3. Signin page mengabaikan query param `?message=` yang dikirim callback saat gagal — tambah display kecil.

## Changes (code — 5 file + 1 migration)

### 1. `src/app/(auth)/signin/actions.ts` — server action baru

```ts
import { headers } from "next/headers"; // tambah import

export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) {
    redirect("/signin?message=Could+not+sign+in+with+Google");
  }
  redirect(data.url); // redirect eksternal ke Google consent screen
}
```

### 2. `src/app/(auth)/_components/GoogleButton.tsx` — komponen baru (shared signin+signup)

Client-safe form button: `<form action={signInWithGoogle}>` + tombol full-width outline style (border-gray-300, bg-white, hover:bg-gray-50) + inline SVG Google "G" logo + teks **"Continue with Google"** (English-first rule; sisa halaman masih Indonesian = existing debt). Plus divider "atau" di atasnya. Dipakai identik di dua halaman → 1 komponen, bukan duplikat SVG.

### 3. `src/app/(auth)/signin/page.tsx` — render `<GoogleButton />` di bawah form + tampilkan `?message=` via `useSearchParams` (banner merah, pola sama dengan `state?.error`). Wrap perlu `<Suspense>` (Next requirement untuk `useSearchParams`).

### 4. `src/app/(auth)/signup/page.tsx` — render `<GoogleButton />` di bawah form (styling shell identik dengan signin).

### 5. `src/lib/supabase/middleware.ts` — allowlist callback

```ts
const publicPaths = ["/signin", "/signup", "/auth/callback"];
if (!user && !publicPaths.some((p) => request.nextUrl.pathname.startsWith(p))) { ... }
```

### 6. Migration — update trigger `handle_new_user` copy avatar

File `supabase/migrations/<timestamp>_handle_new_user_avatar.sql` + apply via MCP `apply_migration`:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;
```

(Recreate persis body trigger live + tambah kolom avatar_url — verifikasi body live dulu via `execute_sql` `pg_get_functiondef` sebelum replace, jangan asal timpa.)

## Manual setup (user — tidak bisa diotomasi)

1. **Google Cloud Console** → APIs & Services → Credentials → Create OAuth client ID (Web application):
   - Authorized JavaScript origins: `http://localhost:3000` (+ domain prod nanti)
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback` (ambil dari MCP `get_project_url`)
2. **Supabase Dashboard** → Authentication → Sign In / Providers → Google: enable, paste Client ID + Client Secret.
3. **Supabase Dashboard** → Authentication → URL Configuration: pastikan `http://localhost:3000/auth/callback` ada di Redirect URLs (+ prod URL nanti).

Tanpa step ini tombol Google akan error `provider is not enabled`.

## Catatan perilaku

- Email/password login TETAP ada — Google jadi opsi tambahan.
- User existing (email sama, sudah verified) yang login Google → Supabase auto-link identity ke user yang sama; data tidak dobel. Trigger hanya jalan untuk `auth.users` INSERT baru.
- Net worth/queries tidak tersentuh — `user.id` flow sama.

## Workflow steps (post-approval, sesuai /new-feature-workflow)

1. Copy plan ini → `docs/plans/2026-08-20-<bf-id>-google-oauth-signin.md`
2. `bd create --title="feat: Google OAuth sign-in" --type=feature --priority=2` → rename sesi `/rename bf-xxx google-oauth`
3. GH issue: **skip** (project ini no remote workflow untuk GH issue per CLAUDE.md project)
4. Prompt file `docs/prompts/2026-08-20-<bf-id>-google-oauth-signin.md`
5. Mode: **5 file + 1 migration → threshold A (Antigravity)** — tapi migration + verifikasi trigger live butuh MCP → bagian DB dikerjakan Claude, kode bisa A atau B. Rekomendasi praktis: **B (direct)** sekalian, kode kecil (~120 lines).

## Verification

1. User jalankan `npm run dev` → buka `/signin` → tombol "Continue with Google" tampil di signin + signup.
2. Klik → redirect ke Google consent → pilih akun → balik ke `/` dalam keadaan login.
3. Cek `user_profiles`: row baru punya `display_name` (nama Google) + `avatar_url` terisi.
4. Logout → login Google lagi → tidak ada row dobel.
5. Email/password login masih jalan.
6. `npm run build` (user yang jalankan) — lolos.

## CLAUDE.md Check
- [ ] Pattern baru: OAuth flow + middleware publicPaths → update AGENTS.md (section auth) setelah implementasi
- [ ] Trigger `handle_new_user` kini terdokumentasi di repo (migration) — catat di AGENTS.md
- [ ] README: fitur "Sign in with Google" → update
- [ ] roadmap.md: status fitur
