import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js runs this file before every matching request.
// (In Next.js versions before 16 this file is called middleware.ts and the
// function is named "middleware".)
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static files and images, run on everything else.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};