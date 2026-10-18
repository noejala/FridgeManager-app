-- Findings from the Supabase security advisor + a read of the live policies.

-- 1. Every SECURITY DEFINER RPC was executable by `anon` (Postgres grants EXECUTE
--    to PUBLIC by default), e.g. search_users / get_user_profiles let anyone list
--    users without signing in. The app only calls them when signed in.
DO $$
DECLARE f regprocedure;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
END $$;

-- 2. fridge_members: "owner update member" also matched the member's OWN row with no
--    WITH CHECK, so a viewer could set role = 'owner' and gain full rights.
--    Only the fridge owner may change members, and only their role.
DROP POLICY IF EXISTS "owner update member" ON public.fridge_members;
CREATE POLICY "owner update member"
  ON public.fridge_members FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM fridges f WHERE f.id = fridge_id AND f.owner_id = (SELECT auth.uid())))
  WITH CHECK (
    EXISTS (SELECT 1 FROM fridges f WHERE f.id = fridge_id AND f.owner_id = (SELECT auth.uid()))
    AND role IN ('editor', 'viewer')
  );
REVOKE UPDATE ON public.fridge_members FROM anon, authenticated;
GRANT UPDATE (role) ON public.fridge_members TO authenticated;

-- 3. friendships: the addressee could UPDATE any column (no WITH CHECK), e.g. rewrite
--    requester_id to forge an accepted friendship with anyone. Only status may change.
DROP POLICY IF EXISTS "addressee_updates_status" ON public.friendships;
CREATE POLICY "addressee_updates_status"
  ON public.friendships FOR UPDATE
  TO authenticated
  USING (addressee_id = (SELECT auth.uid()))
  WITH CHECK (addressee_id = (SELECT auth.uid()));
REVOKE UPDATE ON public.friendships FROM anon, authenticated;
GRANT UPDATE (status) ON public.friendships TO authenticated;
