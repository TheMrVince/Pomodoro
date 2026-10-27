"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/actions";

const LINKS = [
  { href: "/", label: "Timer" },
  { href: "/collection", label: "Collection" },
];

export default function NavBar({ email }: { email?: string }) {
  // usePathname is a hook that tells us which page we are on right now,
  // so the matching link can be highlighted.
  const pathname = usePathname();

  return (
    <header className="flex h-14 items-center justify-between px-6 text-sm">
      <nav aria-label="Main" className="flex gap-5">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "font-semibold underline decoration-[#6E4A86] decoration-2 underline-offset-8"
                  : "font-semibold hover:text-[#6E4A86]"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        {email && <span className="hidden sm:inline">{email}</span>}
        <form action={logout}>
          <button
            type="submit"
            className="font-semibold underline underline-offset-4 outline-none hover:text-[#6E4A86] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E4A86]"
          >
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}