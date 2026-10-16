"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Set to 0.1 (about 6 seconds) while testing, then back to 30.
const DURATION_MINUTES = 30;
const DURATION_MS = DURATION_MINUTES * 60 * 1000;

const RING_RADIUS = 148;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type Status = "idle" | "running" | "done";

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function Timer() {
  const [task, setTask] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(DURATION_MS);
  const reduceMotion = useReducedMotion();

  // The countdown is computed from a fixed end timestamp, never by counting
  // ticks, so it stays accurate even when the browser throttles a background tab.
  useEffect(() => {
    if (status !== "running" || endsAt === null) return;

    const tick = () => {
      const left = endsAt - Date.now();
      if (left <= 0) {
        setRemaining(0);
        setStatus("done");
      } else {
        setRemaining(left);
      }
    };

    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [status, endsAt]);

  useEffect(() => {
    document.title =
      status === "running" ? `${formatTime(remaining)} - Hatch` : "Hatch";
  }, [status, remaining]);

  function start() {
    setEndsAt(Date.now() + DURATION_MS);
    setRemaining(DURATION_MS);
    setStatus("running");
  }

  function reset() {
    setStatus("idle");
    setEndsAt(null);
    setRemaining(DURATION_MS);
  }

  const progress = status === "done" ? 1 : 1 - remaining / DURATION_MS;

  const wobble =
    reduceMotion || status === "idle"
      ? { animate: { rotate: 0 }, transition: { duration: 0.3 } }
      : status === "running"
        ? {
            animate: { rotate: [0, -2.5, 2.5, 0] },
            transition: {
              duration: 3.2,
              repeat: Infinity,
              ease: "easeInOut" as const,
            },
          }
        : {
            animate: { rotate: [0, -8, 8, -8, 8, 0] },
            transition: {
              duration: 1.2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut" as const,
            },
          };

  const message =
    status === "idle"
      ? "Name a task, then start a 30-minute session to warm your egg."
      : status === "running"
        ? "Your egg is warming. Stay with your task."
        : "Session complete. Your egg is a little closer to hatching.";

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-6 py-10">
      <h1
        className="text-2xl font-medium tracking-wide"
        style={{ fontFamily: "var(--font-fredoka)" }}
      >
        Hatch
      </h1>

      <div className="relative w-full max-w-[320px]">
        <svg
          viewBox="0 0 320 320"
          className="h-auto w-full"
          role="img"
          aria-label={`Egg with a progress ring, ${Math.round(progress * 100)} percent complete`}
        >
          <circle
            cx="160"
            cy="160"
            r={RING_RADIUS}
            fill="none"
            stroke="#CFDCC9"
            strokeWidth="8"
          />
          <circle
            cx="160"
            cy="160"
            r={RING_RADIUS}
            fill="none"
            stroke="#6E4A86"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
            transform="rotate(-90 160 160)"
            style={{ transition: "stroke-dashoffset 0.25s linear" }}
          />

          <motion.g style={{ originX: 0.5, originY: 1 }} {...wobble}>
            <path
              d="M160 60 C112 60 80 140 80 190 C80 240 115 270 160 270 C205 270 240 240 240 190 C240 140 208 60 160 60 Z"
              fill="#FBEBCB"
              stroke="#25332B"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <g fill="#D9A5B3">
              <circle cx="130" cy="205" r="4" />
              <circle cx="186" cy="218" r="5" />
              <circle cx="156" cy="244" r="3.5" />
              <circle cx="205" cy="176" r="3.5" />
              <circle cx="118" cy="165" r="3" />
              <circle cx="172" cy="100" r="3" />
            </g>
            <g
              fill="none"
              stroke="#25332B"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M130 112 L145 132 L135 150 L152 168"
                opacity={progress > 0.5 ? 1 : 0}
              />
              <path
                d="M192 122 L180 142 L196 160"
                opacity={progress > 0.8 ? 1 : 0}
              />
            </g>
          </motion.g>
        </svg>
      </div>

      <p
        role="timer"
        aria-live="off"
        className="text-6xl font-medium tabular-nums"
        style={{ fontFamily: "var(--font-fredoka)" }}
      >
        {formatTime(remaining)}
      </p>

      <p aria-live="polite" className="max-w-xs text-center text-base">
        {message}
      </p>

      <div className="flex w-full max-w-xs flex-col items-center gap-4">
        <div className="w-full">
          <label htmlFor="task" className="mb-1 block text-sm font-semibold">
            Task
          </label>
          <input
            id="task"
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            disabled={status === "running"}
            placeholder="Write the project report"
            className="w-full rounded-xl border-2 border-[#CFDCC9] bg-white/70 px-4 py-2.5 text-base outline-none transition placeholder:text-[#25332B]/40 focus-visible:border-[#6E4A86] disabled:opacity-60"
          />
        </div>

        {status === "running" ? (
          <button
            type="button"
            onClick={reset}
            className="rounded-full px-4 py-2 text-base font-semibold underline underline-offset-4 outline-none hover:text-[#6E4A86] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E4A86]"
          >
            Give up
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            className="rounded-full bg-[#6E4A86] px-8 py-3 text-lg font-semibold text-white outline-none transition hover:bg-[#59396D] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E4A86]"
          >
            {status === "done" ? "Start another session" : "Start session"}
          </button>
        )}
      </div>
    </section>
  );
}