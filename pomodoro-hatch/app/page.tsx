import Timer from "@/components/Timer";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;

  return (
    <main className="relative min-h-screen bg-[#E9F0E4] text-[#25332B]">
      <div className="absolute right-0 top-0 flex items-center gap-3 px-6 py-4 text-sm">
        {email && <span>{email}</span>}
        <form action={logout}>
          <button
            type="submit"
            className="font-semibold underline underline-offset-4 outline-none hover:text-[#6E4A86] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E4A86]"
          >
            Log out
          </button>
        </form>
      </div>
      <Timer />
    </main>
  );
}