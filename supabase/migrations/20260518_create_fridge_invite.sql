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

  v_token := encode(gen_random_bytes(16), 'hex');

  INSERT INTO fridge_members (fridge_id, user_id, role, invite_token)
  VALUES (p_fridge_id, NULL, p_role, v_token);

  RETURN v_token;
END;
$$;
