"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { handleAuthError } from "@/lib/errorUtils";

export async function signIn(formData: FormData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    redirect("/signin?message=Email dan password wajib diisi");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message = handleAuthError(error);
    redirect(`/signin?message=${encodeURIComponent(message)}`);
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/signin");
}
