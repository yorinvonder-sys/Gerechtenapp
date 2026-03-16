-- =============================================================
-- IMPROVEMENTS MIGRATION
-- Full-text search, shopping lists, rate limiting, season filter
-- =============================================================

-- ─── 1. FULL-TEXT SEARCH op recipes ─────────────────────────
-- Gebruik pg_trgm (trigram) index voor fuzzy search — geen tsvector nodig
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_recipes_title_trgm ON recipes USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_recipes_desc_trgm ON recipes USING gin(description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_public_recipes_title_trgm ON public_recipes USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_public_recipes_desc_trgm ON public_recipes USING gin(description gin_trgm_ops);

-- ─── 2. SHOPPING LISTS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopping_lists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id uuid REFERENCES shopping_lists(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text DEFAULT 'Overig',
  checked boolean DEFAULT false,
  recipe_title text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own shopping lists" ON shopping_lists
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users manage own shopping list items" ON shopping_list_items
    FOR ALL USING (
      list_id IN (SELECT id FROM shopping_lists WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Shared shopping lists (via shared_meal_plans)
DO $$ BEGIN
  CREATE POLICY "Shared users view shopping lists" ON shopping_lists
    FOR SELECT USING (
      user_id IN (
        SELECT owner_id FROM shared_meal_plans WHERE shared_with = auth.uid()
        UNION
        SELECT shared_with FROM shared_meal_plans WHERE owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Shared users manage shopping list items" ON shopping_list_items
    FOR ALL USING (
      list_id IN (
        SELECT sl.id FROM shopping_lists sl
        WHERE sl.user_id IN (
          SELECT owner_id FROM shared_meal_plans WHERE shared_with = auth.uid()
          UNION
          SELECT shared_with FROM shared_meal_plans WHERE owner_id = auth.uid()
          UNION
          SELECT auth.uid()
        )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_shopping_lists_user ON shopping_lists(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list ON shopping_list_items(list_id);

-- Realtime voor shopping list items
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_list_items;

-- ─── 3. RATE LIMITING ──────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_ai_calls integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_ai_calls_date date DEFAULT CURRENT_DATE;

-- ─── 4. DARK MODE PREFERENCE ───────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dark_mode boolean DEFAULT false;

-- ─── 5. SEASON INDEX op public_recipes ─────────────────────
CREATE INDEX IF NOT EXISTS idx_public_recipes_season ON public_recipes USING gin(season);
CREATE INDEX IF NOT EXISTS idx_public_recipes_dietary ON public_recipes USING gin(dietary);
