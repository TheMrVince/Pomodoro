import Link from "next/link";
import CreatureArt from "@/components/CreatureArt";
import { createClient } from "@/lib/supabase/server";

type Species = {
  id: string;
  name: string;
  rarity: string;
  description: string | null;
};

const RARITY_ORDER = ["common", "uncommon", "rare", "legendary"];

// Colors for each rarity: a soft border and a darker label color.
const RARITY_STYLES: Record<string, { border: string; text: string }> = {
  common: { border: "#B8CFB4", text: "#4F6B55" },
  uncommon: { border: "#9CC7D6", text: "#2F6F85" },
  rare: { border: "#C3A6DB", text: "#6E4A86" },
  legendary: { border: "#E3BC4B", text: "#8A6414" },
};

function styleFor(rarity: string) {
  return RARITY_STYLES[rarity] ?? RARITY_STYLES.common;
}

export default async function CollectionPage() {
  // The USER client, not the admin client. Row Level Security makes sure the
  // creatures query only returns this user's rows.
  const supabase = await createClient();

  // Promise.all starts both requests at the same time and waits for both,
  // which is faster than asking for one and then the other.
  const [speciesResult, creaturesResult] = await Promise.all([
    supabase.from("species").select("id, name, rarity, description"),
    supabase.from("creatures").select("species_id"),
  ]);

  if (speciesResult.error || creaturesResult.error) {
    console.error(
      "collection: could not load",
      speciesResult.error,
      creaturesResult.error,
    );
    return (
      <section className="mx-auto max-w-2xl px-6 py-10">
        <p role="alert" className="font-semibold text-[#9B2C2C]">
          Could not load your collection. Please try again.
        </p>
      </section>
    );
  }

  const species: Species[] = [...(speciesResult.data ?? [])].sort(
    (a, b) =>
      RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) ||
      a.name.localeCompare(b.name),
  );
  const creatures = creaturesResult.data ?? [];

  // Count how many of each species the user has hatched.
  const counts = new Map<string, number>();
  for (const creature of creatures) {
    counts.set(creature.species_id, (counts.get(creature.species_id) ?? 0) + 1);
  }

  const found = species.filter((s) => counts.has(s.id)).length;

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1
        className="text-3xl font-medium"
        style={{ fontFamily: "var(--font-fredoka)" }}
      >
        Your collection
      </h1>
      <p className="mt-1 text-base">
        {found} of {species.length} species found
        {creatures.length > 0 && ` · ${creatures.length} hatched in total`}
      </p>

      {creatures.length === 0 && (
        <p className="mt-6 rounded-2xl border-2 border-dashed border-[#B8CFB4] bg-white/50 px-5 py-4 text-base">
          Your collection is empty. Finish focus sessions to warm your egg,
          then{" "}
          <Link
            href="/"
            className="font-semibold underline underline-offset-4 hover:text-[#6E4A86]"
          >
            go hatch your first creature
          </Link>
          .
        </p>
      )}

      <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {species.map((s) => {
          const count = counts.get(s.id) ?? 0;

          // Not found yet: a mystery card.
          if (count === 0) {
            return (
              <li
                key={s.id}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[#B8CFB4] bg-white/40 p-4 text-center"
              >
                <div className="w-full max-w-[110px]">
                  <CreatureArt name={s.name} rarity={s.rarity} unknown />
                </div>
                <p
                  className="text-lg font-medium"
                  style={{ fontFamily: "var(--font-fredoka)" }}
                >
                  ???
                </p>
                <p className="text-xs">Not found yet</p>
              </li>
            );
          }

          const style = styleFor(s.rarity);

          return (
            <li
              key={s.id}
              className="flex flex-col items-center gap-2 rounded-2xl border-2 bg-white/70 p-4 text-center"
              style={{ borderColor: style.border }}
            >
              <div className="relative w-full max-w-[110px]">
                <CreatureArt name={s.name} rarity={s.rarity} />
                {count > 1 && (
                  <span className="absolute -right-2 -top-1 rounded-full bg-[#6E4A86] px-2 py-0.5 text-xs font-semibold text-white">
                    ×{count}
                  </span>
                )}
              </div>
              <p
                className="text-lg font-medium"
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                {s.name}
              </p>
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: style.text }}
              >
                {s.rarity}
              </p>
              {s.description && <p className="text-xs">{s.description}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}