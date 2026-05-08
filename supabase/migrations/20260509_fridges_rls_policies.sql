-- INSERT policy for fridges: authenticated users can create fridges they own
CREATE POLICY "Users can create their own fridges"
  ON fridges FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

-- INSERT policy for fridge_members: fridge owners can add members (including themselves on creation)
CREATE POLICY "Fridge owners can add members"
  ON fridge_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fridges
      WHERE fridges.id = fridge_id
        AND fridges.owner_id = (select auth.uid())
    )
  );
