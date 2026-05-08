-- Add first_name to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS first_name TEXT;

-- search_users: search by display_name OR first_name, return first_name instead of friend_code
CREATE OR REPLACE FUNCTION public.search_users(query TEXT)
RETURNS TABLE(user_id UUID, display_name TEXT, first_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT up.user_id, up.display_name, up.first_name
  FROM user_profiles up
  WHERE up.user_id != auth.uid()
    AND up.display_name IS NOT NULL
    AND (
      up.display_name ILIKE '%' || query || '%'
      OR (up.first_name IS NOT NULL AND up.first_name ILIKE '%' || query || '%')
    )
  ORDER BY
    CASE WHEN up.display_name ILIKE query || '%' THEN 0 ELSE 1 END,
    up.display_name
  LIMIT 20;
END;
$$;

-- get_user_profiles: also return first_name
CREATE OR REPLACE FUNCTION public.get_user_profiles(user_ids UUID[])
RETURNS TABLE(user_id UUID, display_name TEXT, first_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT up.user_id, up.display_name, up.first_name
  FROM user_profiles up
  WHERE up.user_id = ANY(user_ids);
END;
$$;
