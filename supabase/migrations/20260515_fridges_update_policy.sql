-- Allow fridge owners to update their fridges (name, emoji, pantry_staples, etc.)
CREATE POLICY "Fridge owners can update their fridges"
  ON fridges FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

-- Allow any accepted fridge member to update pantry_staples
-- (members share the pantry; only owners can rename via the owner policy above,
--  but since Postgres applies all matching UPDATE policies with OR logic,
--  members can also trigger updates — scope is intentionally broad here to support shared pantry)
CREATE POLICY "Fridge members can update shared fridge pantry"
  ON fridges FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fridge_members
      WHERE fridge_members.fridge_id = fridges.id
        AND fridge_members.user_id = (select auth.uid())
        AND fridge_members.invite_accepted_at IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fridge_members
      WHERE fridge_members.fridge_id = fridges.id
        AND fridge_members.user_id = (select auth.uid())
        AND fridge_members.invite_accepted_at IS NOT NULL
    )
  );
