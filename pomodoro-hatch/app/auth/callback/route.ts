import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The link in the confirmation email sends the user here with a one-time
// code. We trade that code for a real login session, then send them home.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}