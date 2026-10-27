import { Suspense } from "react";
import Timer from "@/components/Timer";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_SESSIONS_NEEDED,
  type ActiveSession,
  type EggSnapshot,
} from "@/lib/game";

// This component reads from the database, so it can only run when a real
// visitor's request arrives. It looks up the user's current egg and any
// session still in progress, and hands both to the Timer as props.
async function TimerWithEgg() {
  // The USER client: Row Level Security only lets us see this user's rows.
  const supabase = await createClient();

  // The active egg is the one that has not hatched yet. The unique index we
  // made in the database guarantees a user has at most one.
  const { data: egg, error: eggError } = await supabase
    .from("eggs")
    .select("id, sessions_needed")
    .is("hatched_at", null)
    .maybeSingle();

  if (eggError) {
    console.error("home: could not load egg", eggError);
  }

  // Progress is counted from completed sessions, never stored.
  let progress = 0;
  if (egg) {
    const { count, error: countError } = await supabase
      .from("focus_sessions")
      .select("id", { count: "exact", head: true })
      .eq("egg_id", egg.id)
      .eq("status", "completed");

    if (countError) {
      console.error("home: could not count sessions", countError);
    }
    progress = count ?? 0;
  }

  const initialEgg: EggSnapshot = {
    progress,
    needed: egg?.sessions_needed ?? DEFAULT_SESSIONS_NEEDED,
  };

  // Is there a session still marked "running"? If the user refreshed or
  // closed the tab mid-session, this is how the timer finds its way back.
  // (startSession keeps at most one running, but we take the newest to be safe.)
  const { data: running, error: runningError } = await supabase
    .from("focus_sessions")
    .select("id, task, started_at, duration_seconds")
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (runningError) {
    console.error("home: could not load running session", runningError);
  }

  let initialSession: ActiveSession | null = null;
  if (running) {
    const elapsedMs = Date.now() - new Date(running.started_at).getTime();
    initialSession = {
      id: running.id,
      task: running.task ?? "",
      remainingMs: running.duration_seconds * 1000 - elapsedMs,
      durationSeconds: running.duration_seconds,
    };
  }

  return <Timer initialEgg={initialEgg} initialSession={initialSession} />;
}

// Shown for a moment while the server looks up the egg.
function TimerSkeleton() {
  return (
    <section
      aria-busy="true"
      className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-md flex-col items-center justify-center gap-6 px-6 py-10"
    >
      <p className="text-base">Loading your egg...</p>
    </section>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<TimerSkeleton />}>
      <TimerWithEgg />
    </Suspense>
  );
}