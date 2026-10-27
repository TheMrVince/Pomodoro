"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, signup, type AuthState } from "@/app/(auth)/actions";

const initialState: AuthState = {};

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isLogin = mode === "login";

  // useActionState connects the form to a Server Action. It gives back the
  // latest result (state), the function to submit with (formAction), and
  // whether the action is still running (pending).
  const [state, formAction, pending] = useActionState(
    isLogin ? login : signup,
    initialState,
  );

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <h1
        className="text-3xl font-medium"
        style={{ fontFamily: "var(--font-fredoka)" }}
      >
        {isLogin ? "Welcome back" : "Create your account"}
      </h1>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-semibold">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-xl border-2 border-[#CFDCC9] bg-white/70 px-4 py-2.5 text-base outline-none transition focus-visible:border-[#6E4A86]"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-semibold"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="w-full rounded-xl border-2 border-[#CFDCC9] bg-white/70 px-4 py-2.5 text-base outline-none transition focus-visible:border-[#6E4A86]"
          />
        </div>

        <p aria-live="polite" className="min-h-6 text-sm">
          {state.error && (
            <span className="font-semibold text-[#9B2C2C]">{state.error}</span>
          )}
          {state.message && <span>{state.message}</span>}
        </p>

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#6E4A86] px-8 py-3 text-lg font-semibold text-white outline-none transition hover:bg-[#59396D] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E4A86] disabled:opacity-60"
        >
          {pending
            ? isLogin
              ? "Logging in..."
              : "Creating account..."
            : isLogin
              ? "Log in"
              : "Create account"}
        </button>
      </form>

      <p className="text-sm">
        {isLogin ? "New here? " : "Already have an account? "}
        <Link
          href={isLogin ? "/signup" : "/login"}
          className="font-semibold underline underline-offset-4 hover:text-[#6E4A86]"
        >
          {isLogin ? "Create an account" : "Log in"}
        </Link>
      </p>
    </section>
  );
}