
create or replace function public.hatch_egg(
  p_egg_id     uuid,   -- which egg is hatching
  p_user_id    uuid,   -- who owns it
  p_species_id uuid    -- which creature came out (chosen by our server code)
)
returns table (
  creature_id         uuid,
  species_name        text,
  species_rarity      text,
  species_description text
)
language plpgsql
as $$
declare
  v_creature_id uuid;
begin
  -- Step 1: "Claim" the egg. This only changes a row if the egg belongs to
  -- this user AND has not hatched yet. If two requests race, only one of
  -- them finds an unhatched egg to change.
  update public.eggs
     set hatched_at = now()
   where id = p_egg_id
     and user_id = p_user_id
     and hatched_at is null;

  -- "found" is true only if the update changed at least one row.
  if not found then
    raise exception 'egg_not_available';
  end if;

  -- Step 2: Add the creature to the collection.
  insert into public.creatures (user_id, species_id, egg_id)
  values (p_user_id, p_species_id, p_egg_id)
  returning id into v_creature_id;

  -- Step 3: Send back the creature's details so the browser can show them.
  return query
    select v_creature_id, s.name, s.rarity, s.description
      from public.species s
     where s.id = p_species_id;
end;
$$;


-- ---------------------------------------------------------------------
-- Who may call this function?
-- By default, functions in the public schema can be called by anyone who
-- can reach your API. Since this function trusts the user id it is given,
-- browsers must NOT be able to call it. Only our server (which uses the
-- secret key, the "service_role") may.
-- ---------------------------------------------------------------------
revoke all on function public.hatch_egg(uuid, uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.hatch_egg(uuid, uuid, uuid)
  to service_role;