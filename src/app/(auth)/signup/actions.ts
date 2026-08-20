"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { handleAuthError } from "@/lib/errorUtils";
import { getTranslations } from "next-intl/server";

export async function signUp(
  _prevState: { error?: string; success?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password || !name) {
    return { error: (await getTranslations("auth"))("allFieldsRequired") };
  }

  if (password.length < 8) {
    return { error: (await getTranslations("auth"))("passwordMinLength") };
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
    return { error: await handleAuthError(error) };
  }

  redirect("/");
}
