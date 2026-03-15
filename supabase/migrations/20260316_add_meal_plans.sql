-- Weekplanner: maaltijdplanning per dag
CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('ontbijt', 'lunch', 'diner')),
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  custom_meal text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date, meal_type)
);

-- Gedeelde planningen
CREATE TABLE IF NOT EXISTS shared_meal_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, shared_with)
);

-- RLS
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_meal_plans ENABLE ROW LEVEL SECURITY;

-- Gebruikers kunnen hun eigen planningen beheren
CREATE POLICY "Users manage own meal plans" ON meal_plans
  FOR ALL USING (auth.uid() = user_id);

-- Gebruikers kunnen gedeelde planningen bekijken
CREATE POLICY "Users view shared meal plans" ON meal_plans
  FOR SELECT USING (
    user_id IN (
      SELECT owner_id FROM shared_meal_plans WHERE shared_with = auth.uid()
    )
  );

-- Shared meal plans policies
CREATE POLICY "Users manage own shares" ON shared_meal_plans
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Users view their shares" ON shared_meal_plans
  FOR SELECT USING (auth.uid() = shared_with);
