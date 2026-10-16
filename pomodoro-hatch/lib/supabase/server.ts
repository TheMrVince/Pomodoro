import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase client for code that runs on the server: server components,
// Server Actions and Route Handlers. It reads the user's login token from
// the request cookies, so queries run "as" the logged-in user.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server components can't write cookies. That's fine: the proxy
            // refreshes the session and saves the cookies instead.
          }
        },
      },
    },
  );
}