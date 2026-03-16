-- Public recipes table - shared recipe database accessible by all users
CREATE TABLE IF NOT EXISTS public_recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  cuisine text,
  prep_time text,
  servings integer DEFAULT 4,
  ingredients text[] DEFAULT '{}',
  steps text[] DEFAULT '{}',
  tips text,
  tags text[] DEFAULT '{}',
  image_query text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public_recipes ENABLE ROW LEVEL SECURITY;

-- Everyone can read public recipes
CREATE POLICY "Public recipes are readable by all"
  ON public_recipes FOR SELECT
  USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role manages public recipes"
  ON public_recipes FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Index for fast cuisine filtering
CREATE INDEX IF NOT EXISTS idx_public_recipes_cuisine ON public_recipes(cuisine);
CREATE INDEX IF NOT EXISTS idx_public_recipes_tags ON public_recipes USING gin(tags);
