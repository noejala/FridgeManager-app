-- Add emoji column to fridges
ALTER TABLE fridges ADD COLUMN IF NOT EXISTS emoji TEXT NOT NULL DEFAULT '🧊';

-- Update create_fridge RPC to accept emoji
CREATE OR REPLACE FUNCTION create_fridge(fridge_name TEXT, fridge_emoji TEXT DEFAULT '🧊')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_fridge_id uuid;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO fridges (name, owner_id, emoji)
  VALUES (fridge_name, current_user_id, fridge_emoji)
  RETURNING id INTO new_fridge_id;

  INSERT INTO fridge_members (fridge_id, user_id, role, invite_accepted_at)
  VALUES (new_fridge_id, current_user_id, 'owner', now());

  RETURN json_build_object(
    'id', new_fridge_id,
    'name', fridge_name,
    'owner_id', current_user_id,
    'emoji', fridge_emoji,
    'created_at', now()
  );
END;
$$;
