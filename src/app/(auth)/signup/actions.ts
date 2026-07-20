"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { handleAuthError } from "@/lib/errorUtils";

export async function signUp(
  _prevState: { error?: string; success?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password || !name) {
    return { error: "Semua field wajib diisi" };
  }

  if (password.length < 8) {
    return { error: "Password minimal 8 karakter" };
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
    return { error: handleAuthError(error) };
  }

  redirect("/");
}
