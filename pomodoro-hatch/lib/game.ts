// Shared game values. This is plain TypeScript with no server-only or
// browser-only code, so server files and client components can both use it.

// How many sessions a new egg needs. The eggs table in the database has the
// same default (sessions_needed default 5). The database is the real source
// for existing eggs; this constant is only used to show a sensible number
// when no egg exists yet, or right after one has hatched.
export const DEFAULT_SESSIONS_NEEDED = 5;

// A snapshot of how warm the current egg is.
export type EggSnapshot = {
  progress: number; // completed sessions so far
  needed: number; // sessions required to hatch
};

// A focus session that is already in progress when the page loads (for
// example, after a refresh). We send the time REMAINING, not a start time:
// the user's clock can be wrong, but a length of time is the same everywhere.
export type ActiveSession = {
  id: string;
  task: string;
  remainingMs: number; // zero or negative means the time ran out while away
  durationSeconds: number;
};