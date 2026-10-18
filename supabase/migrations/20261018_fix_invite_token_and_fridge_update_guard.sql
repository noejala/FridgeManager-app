-- 1. create_fridge_invite: gen_random_bytes() lives in the `extensions` schema on
--    Supabase, so it was invisible with search_path = public and every call failed
--    with "function gen_random_bytes(integer) does not exist". gen_random_uuid()
--    is core Postgres (13+) and gives 122 random bits — plenty for an invite token.
CREATE OR REPLACE FUNCTION public.create_fridge_invite(
  p_fridge_id uuid,
  p_role text DEFAULT 'editor'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_token text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM fridges WHERE id = p_fridge_id AND owner_id = (SELECT auth.uid())
  ) THEN
    RAISE EXCEPTION 'not_owner';
  END IF;

  v_token := replace(gen_random_uuid()::text, '-', '');

  INSERT INTO fridge_members (fridge_id, user_id, role, invite_token)
  VALUES (p_fridge_id, NULL, p_role, v_token);

  RETURN v_token;
END;
$$;

-- 2. The "Fridge members can update shared fridge pantry" policy lets any accepted
--    member UPDATE the whole row, including owner_id (= take over the fridge) and
--    name/emoji. RLS can't restrict columns, so a trigger enforces that non-owners
--    may only change pantry_staples.
CREATE OR REPLACE FUNCTION public.guard_fridge_member_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- auth.uid() is NULL for service-role / dashboard edits: let those through.
  IF (SELECT auth.uid()) IS NOT NULL
     AND (SELECT auth.uid()) <> OLD.owner_id
     AND (to_jsonb(NEW) - 'pantry_staples' - 'updated_at')
         IS DISTINCT FROM (to_jsonb(OLD) - 'pantry_staples' - 'updated_at') THEN
    RAISE EXCEPTION 'only_owner_can_edit_fridge';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_fridge_member_update ON public.fridges;
CREATE TRIGGER guard_fridge_member_update
  BEFORE UPDATE ON public.fridges
  FOR EACH ROW EXECUTE FUNCTION public.guard_fridge_member_update();
