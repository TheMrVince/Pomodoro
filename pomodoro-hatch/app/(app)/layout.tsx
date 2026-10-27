import { Suspense } from "react";
import NavBar from "@/components/NavBar";
import { createClient } from "@/lib/supabase/server";

// Reading the login cookie to find the user's email is "request-time" work:
// it can only happen once a real visitor's request arrives. This small
// component does that work, so it can be wrapped in <Suspense> below.
async function NavBarWithUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;

  return <NavBar email={email} />;
}

// This layout wraps every page inside the (app) folder: the timer page and
// the collection page. The header is written once here instead of being
// pasted into each page.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#E9F0E4] text-[#25332B]">
      {/* The links and Log out button appear instantly. The email fills in
          as soon as the server has looked up who is logged in. */}
      <Suspense fallback={<NavBar />}>
        <NavBarWithUser />
      </Suspense>
      <main>{children}</main>
    </div>
  );
}