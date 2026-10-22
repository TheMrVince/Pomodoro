"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// How long a session lasts. The SERVER owns this number, so the browser
// cannot change it. For testing, put SESSION_DURATION_SECONDS=10 in
// .env.local (and remove it again when you are done).
const DURATION_SECONDS =
  Number(process.env.SESSION_DURATION_SECONDS) || 30 * 60;

// Either it worked and here is the info, or it failed and here is why.
export type StartSessionResult =
  | { ok: true; sessionId: string; durationSeconds: number }
  | { ok: false; error: string };

export async function startSession(task: string): Promise<StartSessionResult> {
  // Step 1: Who is asking? The user client reads the login cookie.
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (!userId) {
    return { ok: false, error: "Please log in first." };
  }

  // From here on we use the admin client, which skips Row Level Security.
  // That is safe only because we have just verified who the user is, and
  // because we always set user_id ourselves instead of trusting the browser.
  const admin = createAdminClient();

  // Step 2: Tidy up. If an earlier session is still marked "running" (for
  // example, the tab was closed), mark it abandoned so only one is running.
  await admin
    .from("focus_sessions")
    .update({ status: "abandoned" })
    .eq("user_id", userId)
    .eq("status", "running");

  // Step 3: Find this user's active egg (the one with no hatched_at).
  const { data: activeEgg, error: findError } = await admin
    .from("eggs")
    .select("id")
    .eq("user_id", userId)
    .is("hatched_at", null)
    .maybeSingle();

  if (findError) {
    console.error("startSession: could not look up egg", findError);
    return { ok: false, error: "Could not load your egg." };
  }

  let eggId = activeEgg?.id;

  // No active egg yet? Make a new one.
  if (!eggId) {
    const { data: newEgg, error: createError } = await admin
      .from("eggs")
      .insert({ user_id: userId })
      .select("id")
      .single();

    if (createError || !newEgg) {
      console.error("startSession: could not create egg", createError);
      return { ok: false, error: "Could not create your egg." };
    }
    eggId = newEgg.id;
  }

  // Step 4: Save the session. We do NOT send started_at. The database fills
  // it in with its own clock, so the browser cannot fake a start time.
  const cleanTask = typeof task === "string" ? task.trim().slice(0, 100) : "";

  const { data: session, error: insertError } = await admin
    .from("focus_sessions")
    .insert({
      user_id: userId,
      egg_id: eggId,
      task: cleanTask || null,
      duration_seconds: DURATION_SECONDS,
    })
    .select("id")
    .single();

  if (insertError || !session) {
    console.error("startSession: could not save session", insertError);
    return { ok: false, error: "Could not start your session." };
  }

  return {
    ok: true,
    sessionId: session.id,
    durationSeconds: DURATION_SECONDS,
  };
}


// =====================================================================
// completeSession: the browser says "my timer finished". The server
// checks whether that is actually true before counting it.
// =====================================================================

// The browser's timer starts a moment AFTER the database stamps started_at
// (the request has to travel back first), and the app server and the
// database have slightly different clocks. This small allowance covers both,
// so honest users are never refused by a fraction of a second.
const GRACE_MS = 5000;

export type CompleteSessionResult =
  | { ok: true; progress: number; sessionsNeeded: number }
  | { ok: false; error: string };

export async function completeSession(
  sessionId: string,
): Promise<CompleteSessionResult> {
  // Public endpoint: never assume the input is what we expect.
  if (typeof sessionId !== "string" || sessionId.length === 0) {
    return { ok: false, error: "Invalid session." };
  }

  // Step 1: Who is asking?
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (!userId) {
    return { ok: false, error: "Please log in first." };
  }

  const admin = createAdminClient();

  // Step 2: Load the session, but only if it belongs to THIS user. If
  // someone sends another person's session ID, nothing comes back.
  const { data: session, error: loadError } = await admin
    .from("focus_sessions")
    .select("id, egg_id, status, started_at, duration_seconds")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (loadError) {
    console.error("completeSession: could not load session", loadError);
    return { ok: false, error: "Could not load your session." };
  }
  if (!session) {
    return { ok: false, error: "Session not found." };
  }
  if (session.status !== "running") {
    return { ok: false, error: "This session is no longer running." };
  }

  // Step 3: Did enough REAL time pass? started_at came from the database's
  // clock, and nothing the browser sends can change it.
  const elapsedMs = Date.now() - new Date(session.started_at).getTime();
  const requiredMs = session.duration_seconds * 1000 - GRACE_MS;

  if (elapsedMs < requiredMs) {
    return {
      ok: false,
      error: "That finished too quickly, so it can't be counted.",
    };
  }

  // Step 4: Mark it completed. The extra .eq("status", "running") means the
  // change only happens if the session is STILL running at this moment, so
  // two requests at once can't both count the same session.
  const { data: updated, error: updateError } = await admin
    .from("focus_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", session.id)
    .eq("status", "running")
    .select("id");

  if (updateError) {
    console.error("completeSession: could not update session", updateError);
    return { ok: false, error: "Could not save your session." };
  }
  if (!updated || updated.length === 0) {
    return { ok: false, error: "This session was already counted." };
  }

  // Step 5: Work out the egg's progress by COUNTING completed sessions.
  // (There is no stored counter, so it can never disagree with the sessions.)
  if (!session.egg_id) {
    return { ok: true, progress: 0, sessionsNeeded: 5 };
  }

  const { count, error: countError } = await admin
    .from("focus_sessions")
    .select("id", { count: "exact", head: true })
    .eq("egg_id", session.egg_id)
    .eq("status", "completed");

  const { data: egg, error: eggError } = await admin
    .from("eggs")
    .select("sessions_needed")
    .eq("id", session.egg_id)
    .single();

  if (countError || eggError || !egg) {
    console.error("completeSession: could not read progress", countError, eggError);
    return { ok: false, error: "Saved, but could not read egg progress." };
  }

  return { ok: true, progress: count ?? 0, sessionsNeeded: egg.sessions_needed };
}