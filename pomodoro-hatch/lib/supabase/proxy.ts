import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/signup"];
const PUBLIC_PREFIXES = ["/login", "/signup", "/auth"];

function startsWithAny(path: string, prefixes: string[]) {
  return prefixes.some((prefix) => path.startsWith(prefix));
}

// Runs before every page request. It does two jobs:
// 1. Refresh the login token if it is close to expiring, and save the new
//    cookies on both the request and the response.
// 2. Redirect visitors who aren't logged in to /login.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims() checks the token's signature, so it can be trusted.
  // Don't use getSession() for this on the server.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const path = request.nextUrl.pathname;

  if (!user && !startsWithAny(path, PUBLIC_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && startsWithAny(path, AUTH_PAGES)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}