-- Extra filter fields for public_recipes
ALTER TABLE public_recipes
  ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'gemiddeld',
  ADD COLUMN IF NOT EXISTS meal_type text DEFAULT 'diner',
  ADD COLUMN IF NOT EXISTS dietary text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS calories_estimate integer,
  ADD COLUMN IF NOT EXISTS season text[] DEFAULT '{}';

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_public_recipes_difficulty ON public_recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_public_recipes_meal_type ON public_recipes(meal_type);
CREATE INDEX IF NOT EXISTS idx_public_recipes_dietary ON public_recipes USING gin(dietary);
CREATE INDEX IF NOT EXISTS idx_public_recipes_season ON public_recipes USING gin(season);
CREATE INDEX IF NOT EXISTS idx_public_recipes_prep_time ON public_recipes(prep_time);

-- Full text search index
ALTER TABLE public_recipes ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION update_recipe_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('dutch', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('dutch', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('dutch', coalesce(NEW.cuisine, '')), 'C') ||
    setweight(to_tsvector('dutch', coalesce(array_to_string(NEW.ingredients, ' '), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recipe_search_vector ON public_recipes;
CREATE TRIGGER trg_recipe_search_vector
  BEFORE INSERT OR UPDATE ON public_recipes
  FOR EACH ROW EXECUTE FUNCTION update_recipe_search_vector();

CREATE INDEX IF NOT EXISTS idx_public_recipes_search ON public_recipes USING gin(search_vector);

-- Backfill search vectors for existing recipes
UPDATE public_recipes SET search_vector =
  setweight(to_tsvector('dutch', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('dutch', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('dutch', coalesce(cuisine, '')), 'C') ||
  setweight(to_tsvector('dutch', coalesce(array_to_string(ingredients, ' '), '')), 'D');
