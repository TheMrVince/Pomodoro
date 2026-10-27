"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// The shape of what login and signup send back to the form.
export type AuthState = {
  error?: string;
  message?: string;
};

export async function login(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });

  if (error) return { error: error.message };

  redirect("/");
}

export async function signup(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) return { error: error.message };

  // With "Confirm email" turned off, Supabase logs the user in right away.
  if (data.session) redirect("/");

  return { message: "Check your email for a link to confirm your account." };
}

export async function logout() {
  const supabase = await createClient();

  // End any session that is still running, so it does not sit "running"
  // while the user is signed out. This has to happen BEFORE signing out,
  // because we need the login to know who the user is.
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (userId) {
    const admin = createAdminClient();
    const { error } = await admin
      .from("focus_sessions")
      .update({ status: "abandoned" })
      .eq("user_id", userId)
      .eq("status", "running");

    // Logging out must never be blocked by this, so we only record a failure.
    if (error) {
      console.error("logout: could not end the running session", error);
    }
  }

  await supabase.auth.signOut();
  redirect("/login");
}