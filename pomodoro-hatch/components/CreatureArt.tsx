// Placeholder art: a simple creature drawn in code. The body color comes from
// the rarity, and the ears or antennae come from the name, so every species
// looks a little different. Real artwork can replace this component later
// without touching any other file.

const BODY_COLORS: Record<string, string> = {
  common: "#A9C9A4",
  uncommon: "#8FC1D4",
  rare: "#C3A6DB",
  legendary: "#F2CF6B",
};

const INK = "#25332B";

// Turns a name into a number, so the same name always gives the same look.
function hashName(name: string) {
  let hash = 0;
  for (const ch of name) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return hash;
}

type CreatureArtProps = {
  name: string;
  rarity: string;
  unknown?: boolean; // true draws a grey "?" silhouette instead
};

export default function CreatureArt({
  name,
  rarity,
  unknown = false,
}: CreatureArtProps) {
  const body = unknown ? "#CFDCC9" : (BODY_COLORS[rarity] ?? BODY_COLORS.common);
  const variant = hashName(name) % 3;
  const sparkles = !unknown && (rarity === "rare" || rarity === "legendary");

  return (
    <svg viewBox="0 0 120 120" className="h-auto w-full" aria-hidden="true">
      {/* Ears or antennae are drawn first, so the body covers their bases. */}
      {variant === 0 && (
        <g fill={body} stroke={INK} strokeWidth="2.5">
          <circle cx="34" cy="38" r="12" />
          <circle cx="86" cy="38" r="12" />
        </g>
      )}
      {variant === 1 && (
        <g fill={body} stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
          <path d="M24 52 L30 18 L50 40 Z" />
          <path d="M96 52 L90 18 L70 40 Z" />
        </g>
      )}
      {variant === 2 && (
        <g stroke={INK} strokeWidth="2.5" strokeLinecap="round">
          <line x1="46" y1="38" x2="40" y2="16" />
          <line x1="74" y1="38" x2="80" y2="16" />
          <circle cx="40" cy="14" r="4" fill={body} />
          <circle cx="80" cy="14" r="4" fill={body} />
        </g>
      )}

      <ellipse
        cx="60"
        cy="72"
        rx="38"
        ry="34"
        fill={body}
        stroke={INK}
        strokeWidth="2.5"
      />

      {unknown ? (
        <text
          x="60"
          y="84"
          textAnchor="middle"
          fontSize="36"
          fontWeight="600"
          fill={INK}
          opacity="0.55"
        >
          ?
        </text>
      ) : (
        <>
          <circle cx="46" cy="68" r="4" fill={INK} />
          <circle cx="74" cy="68" r="4" fill={INK} />
          <circle cx="37" cy="80" r="5" fill="#D9A5B3" opacity="0.8" />
          <circle cx="83" cy="80" r="5" fill="#D9A5B3" opacity="0.8" />
          <path
            d="M54 82 Q60 88 66 82"
            fill="none"
            stroke={INK}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      )}

      {sparkles && (
        <g fill="#FFFFFF" stroke={INK} strokeWidth="1.5" strokeLinejoin="round">
          <path d="M100 20 L103 28 L111 31 L103 34 L100 42 L97 34 L89 31 L97 28 Z" />
          {rarity === "legendary" && (
            <path d="M18 70 L20 76 L26 78 L20 80 L18 86 L16 80 L10 78 L16 76 Z" />
          )}
        </g>
      )}
    </svg>
  );
}