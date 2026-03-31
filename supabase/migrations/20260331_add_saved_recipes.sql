CREATE TABLE saved_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_data JSONB NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('gemini', 'mealdb')),
  saved_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_recipes FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved recipes"
  ON saved_recipes
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE INDEX saved_recipes_user_id_idx ON saved_recipes(user_id);
