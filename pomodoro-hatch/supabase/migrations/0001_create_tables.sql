
-- ---------------------------------------------------------------------
-- 1. species: a shared lookup table of every creature that can hatch.
--    Not owned by any user. Everyone reads the same rows.
-- ---------------------------------------------------------------------
create table public.species (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  rarity      text not null
              check (rarity in ('common', 'uncommon', 'rare', 'legendary')),
  description text,
  created_at  timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 2. eggs: each user always has one unhatched egg being warmed.
--    There is no "progress" column on purpose. Progress is counted from
--    completed focus_sessions, so the number can never disagree with them.
-- ---------------------------------------------------------------------
create table public.eggs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  sessions_needed integer not null default 5 check (sessions_needed > 0),
  created_at      timestamptz not null default now(),
  hatched_at      timestamptz            -- null means "not hatched yet"
);

-- A user can have at most one unhatched egg at a time.
create unique index one_active_egg_per_user
  on public.eggs (user_id)
  where hatched_at is null;


-- ---------------------------------------------------------------------
-- 3. focus_sessions: one row per attempt at a 30-minute session.
--    started_at is filled in by the database clock, never by the browser.
-- ---------------------------------------------------------------------
create table public.focus_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  egg_id           uuid references public.eggs (id) on delete set null,
  task             text,
  status           text not null default 'running'
                   check (status in ('running', 'completed', 'abandoned')),
  duration_seconds integer not null default 1800 check (duration_seconds > 0),
  started_at       timestamptz not null default now(),
  completed_at     timestamptz
);


-- ---------------------------------------------------------------------
-- 4. creatures: the collection. One row per creature a user has hatched.
-- ---------------------------------------------------------------------
create table public.creatures (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  species_id uuid not null references public.species (id),
  egg_id     uuid references public.eggs (id) on delete set null,
  hatched_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- Indexes: make the lookups we will do all the time fast.
-- ---------------------------------------------------------------------
create index focus_sessions_user_idx
  on public.focus_sessions (user_id, started_at desc);
create index focus_sessions_egg_idx on public.focus_sessions (egg_id);
create index creatures_user_idx     on public.creatures (user_id);


-- =====================================================================
-- Row Level Security (RLS)
-- Turning RLS on means: no rows are visible unless a policy allows it.
-- =====================================================================
alter table public.species        enable row level security;
alter table public.eggs           enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.creatures      enable row level security;

-- Logged-in users may read the species list.
create policy "species readable by logged-in users"
  on public.species for select
  to authenticated
  using (true);

-- Logged-in users may read only THEIR OWN rows in the other tables.
create policy "users read own eggs"
  on public.eggs for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users read own sessions"
  on public.focus_sessions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users read own creatures"
  on public.creatures for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- There are deliberately NO insert, update or delete policies.
-- That means browsers can never write to these tables directly.
-- All writes will come from our own server code, after it has checked
-- the rules (for example, that 30 real minutes have passed).


-- ---------------------------------------------------------------------
-- Permissions: allow the API roles to reach the tables at all.
-- (RLS above then decides which rows they can see.)
-- ---------------------------------------------------------------------
grant select on public.species, public.eggs,
                public.focus_sessions, public.creatures
  to authenticated;

grant all on public.species, public.eggs,
             public.focus_sessions, public.creatures
  to service_role;


-- ---------------------------------------------------------------------
-- Starter species (placeholder names, change them any time).
-- "on conflict do nothing" makes this safe to run twice.
-- ---------------------------------------------------------------------
insert into public.species (name, rarity, description) values
  ('Moss Pup',    'common',    'A sleepy pup with a coat of soft green moss.'),
  ('Pebble Newt', 'common',    'Collects smooth stones and hums while it works.'),
  ('Dew Moth',    'common',    'Wings that catch the morning light.'),
  ('Ember Fox',   'uncommon',  'Its tail glows like a small campfire.'),
  ('Cloud Whale', 'rare',      'Drifts through the sky, trailing soft rain.'),
  ('Star Dragon', 'legendary', 'Only hatches for the most focused of days.')
on conflict (name) do nothing;