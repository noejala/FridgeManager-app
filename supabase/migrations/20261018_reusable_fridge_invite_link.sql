-- Reusable invite link (Tricount-style): one link per fridge that anyone can use
-- to join, instead of a single-use token per click. The owner can reset it, and it
-- expires after 30 days (the next share then creates a fresh one).

CREATE TABLE public.fridge_invites (
  fridge_id uuid PRIMARY KEY REFERENCES public.fridges(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- No policies: only reachable through the SECURITY DEFINER RPCs below, so members
-- can't read the token and anon can't enumerate it.
ALTER TABLE public.fridge_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fridge_invites FORCE ROW LEVEL SECURITY;

-- Returns the fridge's current link, creating it (or a fresh one if expired).
-- p_reset = true invalidates the old link immediately.
CREATE OR REPLACE FUNCTION public.create_fridge_invite(
  p_fridge_id uuid,
  p_role text DEFAULT 'editor',
  p_reset boolean DEFAULT false
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
  IF p_role NOT IN ('editor', 'viewer') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;

  IF NOT p_reset THEN
    SELECT token INTO v_token FROM fridge_invites
    WHERE fridge_id = p_fridge_id AND expires_at > now();
    IF FOUND THEN
      UPDATE fridge_invites SET role = p_role WHERE fridge_id = p_fridge_id;
      RETURN v_token;
    END IF;
  END IF;

  v_token := replace(gen_random_uuid()::text, '-', '');
  INSERT INTO fridge_invites (fridge_id, token, role)
  VALUES (p_fridge_id, v_token, p_role)
  ON CONFLICT (fridge_id) DO UPDATE
    SET token = EXCLUDED.token, role = EXCLUDED.role,
        expires_at = now() + interval '30 days', created_at = now();
  RETURN v_token;
END;
$$;

-- The old 2-arg signature would otherwise stay callable alongside the new one.
DROP FUNCTION IF EXISTS public.create_fridge_invite(uuid, text);

-- Joining doesn't consume the link. Already a member -> no-op, just returns the fridge.
CREATE OR REPLACE FUNCTION public.accept_fridge_invite(token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_invite fridge_invites%ROWTYPE;
  v_fridge fridges%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_invite FROM fridge_invites fi
  WHERE fi.token = accept_fridge_invite.token AND fi.expires_at > now();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;

  INSERT INTO fridge_members (fridge_id, user_id, role, invite_accepted_at)
  VALUES (v_invite.fridge_id, v_uid, v_invite.role, now())
  ON CONFLICT (fridge_id, user_id) DO NOTHING;

  SELECT * INTO v_fridge FROM fridges WHERE id = v_invite.fridge_id;
  RETURN json_build_object('fridge_id', v_fridge.id, 'fridge_name', v_fridge.name);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_fridge_invite(uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_fridge_invite(uuid, text, boolean) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.accept_fridge_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_fridge_invite(text) TO authenticated;
