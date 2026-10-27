"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import CreatureArt from "@/components/CreatureArt";
import type { HatchedCreature } from "@/app/actions/sessions";

// The scene is always in exactly ONE of these stages, and moves through
// them in order: shake -> crack -> burst -> reveal.
type Stage = "shake" | "crack" | "burst" | "reveal";

const NEXT_STAGE = { shake: "crack", crack: "burst", burst: "reveal" } as const;
const STAGE_MS = { shake: 1800, crack: 1400, burst: 700 } as const;

const INK = "#25332B";

// The egg shape is the same one used on the timer page.
const EGG_PATH =
  "M160 60 C112 60 80 140 80 190 C80 240 115 270 160 270 C205 270 240 240 240 190 C240 140 208 60 160 60 Z";

// A zigzag crack across the middle of the egg. The two clip shapes below
// follow the exact same zigzag, so when the egg splits, the halves fit the crack.
const CRACK_PATH =
  "M78 168 L100 180 L120 160 L140 182 L160 158 L182 182 L200 160 L222 180 L242 166";
const CLIP_TOP =
  "M0 0 H320 V166 L242 166 L222 180 L200 160 L182 182 L160 158 L140 182 L120 160 L100 180 L78 168 L0 168 Z";
const CLIP_BOTTOM =
  "M0 320 H320 V166 L242 166 L222 180 L200 160 L182 182 L160 158 L140 182 L120 160 L100 180 L78 168 L0 168 Z";

// Eight sparkles that fly outward from the middle during the burst.
const PARTICLES = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  return { x: Math.cos(angle) * 120, y: Math.sin(angle) * 120 };
});

const RARITY_TEXT: Record<string, string> = {
  common: "#4F6B55",
  uncommon: "#2F6F85",
  rare: "#6E4A86",
  legendary: "#8A6414",
};

function EggBody() {
  return (
    <>
      <path
        d={EGG_PATH}
        fill="#FBEBCB"
        stroke={INK}
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
    </>
  );
}

type HatchSceneProps = {
  creature: HatchedCreature;
  onDone: () => void;
};

export default function HatchScene({ creature, onDone }: HatchSceneProps) {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState<Stage>(reduceMotion ? "reveal" : "shake");

  const dialogRef = useRef<HTMLDialogElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);

  // Open the native modal dialog. The browser then handles the dark
  // backdrop, keeps keyboard focus inside, and closes it on Escape.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // Move to the next stage after a pause. The cleanup cancels the timer if
  // the stage changes early (for example when "Skip" is pressed).
  useEffect(() => {
    if (stage === "reveal") return;
    const id = setTimeout(() => setStage(NEXT_STAGE[stage]), STAGE_MS[stage]);
    return () => clearTimeout(id);
  }, [stage]);

  // When the creature appears, put keyboard focus on the Continue button.
  useEffect(() => {
    if (stage === "reveal") continueRef.current?.focus();
  }, [stage]);

  const rarityColor = RARITY_TEXT[creature.rarity] ?? RARITY_TEXT.common;

  return (
    <dialog
      ref={dialogRef}
      onClose={onDone}
      aria-label="Egg hatching"
      className="m-auto w-[min(92vw,26rem)] rounded-3xl bg-[#E9F0E4] p-6 text-[#25332B] shadow-xl backdrop:bg-[#25332B]/60"
    >
      {/* Screen readers hear a short announcement when the stage changes. */}
      <p className="sr-only" aria-live="polite">
        {stage === "reveal"
          ? `Your egg hatched: ${creature.name}, ${creature.rarity}.`
          : "Your egg is hatching."}
      </p>

      {stage !== "reveal" ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-[300px]">
            <svg viewBox="0 0 320 320" className="h-auto w-full" aria-hidden="true">
              <defs>
                <clipPath id="hatch-clip-top">
                  <path d={CLIP_TOP} />
                </clipPath>
                <clipPath id="hatch-clip-bottom">
                  <path d={CLIP_BOTTOM} />
                </clipPath>
              </defs>

              {/* Stages 1 and 2: the whole egg shakes, and the crack draws in. */}
              {(stage === "shake" || stage === "crack") && (
                <motion.g
                  key={stage}
                  style={{ originX: 0.5, originY: 1 }}
                  animate={
                    stage === "shake"
                      ? {
                          rotate: [0, -4, 4, -6, 6, -9, 9, -12, 12, 0],
                          scale: [1, 1.06],
                        }
                      : {
                          rotate: [0, -12, 12, -14, 14, -12, 12, -14, 14, 0],
                          scale: [1.06, 1.1],
                        }
                  }
                  transition={{
                    duration: stage === "shake" ? 1.8 : 1.4,
                    ease: "easeInOut",
                  }}
                >
                  <EggBody />
                  {stage === "crack" && (
                    <motion.path
                      d={CRACK_PATH}
                      fill="none"
                      stroke={INK}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  )}
                </motion.g>
              )}

              {/* Stage 3: the egg splits along the crack, with a flash and sparkles. */}
              {stage === "burst" && (
                <>
                  <motion.g
                    clipPath="url(#hatch-clip-top)"
                    initial={{ scale: 1.1, y: 0, rotate: 0, opacity: 1 }}
                    animate={{ scale: 1.1, y: -80, rotate: -14, opacity: 0 }}
                    transition={{ duration: 0.7, ease: "easeIn" }}
                  >
                    <EggBody />
                    <path
                      d={CRACK_PATH}
                      fill="none"
                      stroke={INK}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.g>
                  <motion.g
                    clipPath="url(#hatch-clip-bottom)"
                    initial={{ scale: 1.1, y: 0, rotate: 0, opacity: 1 }}
                    animate={{ scale: 1.1, y: 70, rotate: 10, opacity: 0 }}
                    transition={{ duration: 0.7, ease: "easeIn" }}
                  >
                    <EggBody />
                    <path
                      d={CRACK_PATH}
                      fill="none"
                      stroke={INK}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.g>

                  <motion.circle
                    cx="160"
                    cy="165"
                    r="40"
                    fill="#FFFFFF"
                    style={{ originX: 0.5, originY: 0.5 }}
                    initial={{ scale: 0.2, opacity: 0.95 }}
                    animate={{ scale: 5, opacity: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />

                  {PARTICLES.map((p, i) => (
                    <motion.circle
                      key={i}
                      cx="160"
                      cy="165"
                      r="6"
                      fill="#F2CF6B"
                      stroke={INK}
                      strokeWidth="1.5"
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.4 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                  ))}
                </>
              )}
            </svg>
          </div>

          <p className="min-h-6 text-center text-base">
            {stage === "shake" && "Something is moving inside..."}
            {stage === "crack" && "It's cracking!"}
          </p>

          <button
            type="button"
            onClick={() => setStage("reveal")}
            className="rounded-full px-4 py-2 text-sm font-semibold underline underline-offset-4 outline-none hover:text-[#6E4A86] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E4A86]"
          >
            Skip animation
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center">
          <motion.div
            className="w-44"
            initial={reduceMotion ? false : { scale: 0.3, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 14 }}
          >
            <CreatureArt name={creature.name} rarity={creature.rarity} />
          </motion.div>

          <motion.div
            className="flex flex-col items-center gap-1"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            <p
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ color: rarityColor }}
            >
              {creature.rarity}
            </p>
            <h2
              className="text-3xl font-medium"
              style={{ fontFamily: "var(--font-fredoka)" }}
            >
              {creature.name}
            </h2>
            {creature.description && (
              <p className="max-w-xs text-base">{creature.description}</p>
            )}
          </motion.div>

          <div className="mt-2 flex flex-col items-center gap-3">
            <button
              ref={continueRef}
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-full bg-[#6E4A86] px-8 py-3 text-lg font-semibold text-white outline-none transition hover:bg-[#59396D] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E4A86]"
            >
              Continue
            </button>
            <Link
              href="/collection"
              className="text-sm font-semibold underline underline-offset-4 hover:text-[#6E4A86]"
            >
              View your collection
            </Link>
          </div>
        </div>
      )}
    </dialog>
  );
}