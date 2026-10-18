-- Daily cap on AI recipe generations per user, enforced server-side by /api/recipes
-- (the old cap lived in the browser's localStorage and was trivially bypassed).

CREATE TABLE public.ai_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT current_date,
  generations integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

-- RPC-only: no policies, users can't reset their own counter.
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage FORCE ROW LEVEL SECURITY;

-- Increments today's counter and returns whether the call is within the limit.
CREATE OR REPLACE FUNCTION public.consume_ai_quota(p_daily_limit integer DEFAULT 30)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_count integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;
  INSERT INTO ai_usage (user_id, day, generations)
  VALUES (v_uid, current_date, 1)
  ON CONFLICT (user_id, day) DO UPDATE SET generations = ai_usage.generations + 1
  RETURNING generations INTO v_count;
  RETURN v_count <= LEAST(p_daily_limit, 30);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_ai_quota(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(integer) TO authenticated;
