"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { handleAuthError } from "@/lib/errorUtils";

export async function signUp(formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password || !name) {
    redirect("/signup?message=❌ Semua field wajib diisi");
  }

  if (password.length < 8) {
    redirect("/signup?message=❌ Password minimal 8 karakter");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    const message = handleAuthError(error);
    redirect(`/signup?message=❌ ${encodeURIComponent(message)}`);
  }

  redirect("/signup?message=✅ Cek email kamu untuk verifikasi akun");
}
