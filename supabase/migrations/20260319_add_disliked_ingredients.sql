ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS disliked_ingredients TEXT[] DEFAULT '{}';
