import NavBar from "@/components/NavBar";
import { createClient } from "@/lib/supabase/server";

// This layout wraps every page inside the (app) folder: the timer page and
// the collection page. The header is written once here instead of being
// pasted into each page.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;

  return (
    <div className="min-h-screen bg-[#E9F0E4] text-[#25332B]">
      <NavBar email={email} />
      <main>{children}</main>
    </div>
  );
}