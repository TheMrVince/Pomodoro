import { createBrowserClient } from "@supabase/ssr";

// Supabase client for code that runs in the browser (client components).
// Not used yet in this phase, but we'll need it later, for example to react
// to realtime changes or read data directly from a client component.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}