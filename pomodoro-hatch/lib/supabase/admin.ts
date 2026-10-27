import "server-only";
import { createClient } from "@supabase/supabase-js";

// A Supabase client that acts as "the app itself", not as a logged-in user.
// It uses the SECRET key, which bypasses Row Level Security, so it can write
// to tables that browsers are not allowed to write to.
//
// Rules for using it:
// - Only call it from server code (Server Actions, Route Handlers).
// - Before using it, always check who the user is and what they may do.
//   RLS will NOT protect you here, because this client skips it.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!, // no NEXT_PUBLIC_ prefix, on purpose
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}