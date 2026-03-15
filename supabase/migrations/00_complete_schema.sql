-- =============================================================
-- COMPLETE DATABASE SCHEMA — Gerechtenapp
-- Voer dit uit in Supabase SQL Editor (Dashboard → SQL Editor)
-- Veilig om meerdere keren te draaien (IF NOT EXISTS overal)
-- =============================================================

-- ─── 1. PROFILES ─────────────────────────────────────────────
-- Wordt automatisch aangemaakt door Supabase Auth trigger,
-- maar we voegen ontbrekende kolommen toe.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS favorite_cuisine text,
  ADD COLUMN IF NOT EXISTS dietary_preferences text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS household_size integer,
  ADD COLUMN IF NOT EXISTS allergies text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dislikes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cooking_level text,
  ADD COLUMN IF NOT EXISTS preferred_cooking_time text;

-- ─── 2. RECIPES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  cuisine text,
  prep_time text,
  servings integer DEFAULT 4,
  ingredients text[] DEFAULT '{}',
  instructions text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  favorite boolean DEFAULT false,
  rating integer DEFAULT 0,
  "addedBy" text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Users manage their own recipes
DO $$ BEGIN
  CREATE POLICY "Users manage own recipes" ON recipes
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 3. PANTRY ITEMS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pantry_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text DEFAULT 'Overig',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own pantry" ON pantry_items
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 4. SHARED RECIPES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS shared_recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  shared_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(recipe_id, shared_with)
);

ALTER TABLE shared_recipes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own shared recipes" ON shared_recipes
    FOR ALL USING (auth.uid() = shared_by);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users view recipes shared with them" ON shared_recipes
    FOR SELECT USING (auth.uid() = shared_with);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow users to view the actual recipe data when shared with them
DO $$ BEGIN
  CREATE POLICY "Users view shared recipe data" ON recipes
    FOR SELECT USING (
      id IN (SELECT recipe_id FROM shared_recipes WHERE shared_with = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 5. MEAL PLANS (Weekplanner) ────────────────────────────
CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('ontbijt', 'lunch', 'diner')),
  recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
  custom_meal text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date, meal_type)
);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own meal plans" ON meal_plans
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 6. SHARED MEAL PLANS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS shared_meal_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, shared_with)
);

ALTER TABLE shared_meal_plans ENABLE ROW LEVEL SECURITY;

-- Owner manages shares
DO $$ BEGIN
  CREATE POLICY "Users manage own shares" ON shared_meal_plans
    FOR ALL USING (auth.uid() = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Bidirectional visibility
DO $$ BEGIN
  CREATE POLICY "Users see who shared with them" ON shared_meal_plans
    FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = shared_with);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 7. SHARED MEAL PLAN COLLABORATION POLICIES ─────────────

-- View shared plans (bidirectional)
DO $$ BEGIN
  CREATE POLICY "Users view shared meal plans" ON meal_plans
    FOR SELECT USING (
      user_id IN (
        SELECT owner_id FROM shared_meal_plans WHERE shared_with = auth.uid()
        UNION
        SELECT shared_with FROM shared_meal_plans WHERE owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Insert meals for shared users
DO $$ BEGIN
  CREATE POLICY "Shared users can add meals" ON meal_plans
    FOR INSERT WITH CHECK (
      user_id IN (
        SELECT owner_id FROM shared_meal_plans WHERE shared_with = auth.uid()
        UNION
        SELECT shared_with FROM shared_meal_plans WHERE owner_id = auth.uid()
      )
      OR auth.uid() = user_id
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Update meals for shared users
DO $$ BEGIN
  CREATE POLICY "Shared users can update meals" ON meal_plans
    FOR UPDATE USING (
      user_id IN (
        SELECT owner_id FROM shared_meal_plans WHERE shared_with = auth.uid()
        UNION
        SELECT shared_with FROM shared_meal_plans WHERE owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Delete meals for shared users
DO $$ BEGIN
  CREATE POLICY "Shared users can delete meals" ON meal_plans
    FOR DELETE USING (
      user_id IN (
        SELECT owner_id FROM shared_meal_plans WHERE shared_with = auth.uid()
        UNION
        SELECT shared_with FROM shared_meal_plans WHERE owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 8. HELPER FUNCTIONS ────────────────────────────────────

-- Find user by email (for sharing features)
CREATE OR REPLACE FUNCTION get_user_id_by_email(email_input text)
RETURNS uuid AS $$
  SELECT id FROM auth.users WHERE email = email_input LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ─── 9. REALTIME ────────────────────────────────────────────
-- Enable realtime for meal_plans so shared users see live updates
ALTER PUBLICATION supabase_realtime ADD TABLE meal_plans;

-- ─── 10. INDEXES (performance) ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans(user_id, date);
CREATE INDEX IF NOT EXISTS idx_shared_recipes_shared_with ON shared_recipes(shared_with);
CREATE INDEX IF NOT EXISTS idx_shared_meal_plans_owner ON shared_meal_plans(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_meal_plans_shared ON shared_meal_plans(shared_with);
