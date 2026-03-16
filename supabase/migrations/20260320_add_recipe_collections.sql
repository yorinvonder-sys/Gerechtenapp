-- Recipe collections
CREATE TABLE IF NOT EXISTS recipe_collections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recipe_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own collections"
  ON recipe_collections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Collection items (many-to-many)
CREATE TABLE IF NOT EXISTS recipe_collection_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id uuid REFERENCES recipe_collections(id) ON DELETE CASCADE NOT NULL,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  added_at timestamptz DEFAULT now(),
  UNIQUE(collection_id, recipe_id)
);

ALTER TABLE recipe_collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own collection items"
  ON recipe_collection_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM recipe_collections
      WHERE id = recipe_collection_items.collection_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipe_collections
      WHERE id = recipe_collection_items.collection_id
      AND user_id = auth.uid()
    )
  );
