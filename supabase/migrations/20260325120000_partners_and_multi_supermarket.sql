-- =============================================================
-- PARTNER SYSTEEM + MEERDERE SUPERMARKTEN
-- =============================================================

-- 1. Partners tabel (bidirectioneel: beide delen alles)
CREATE TABLE IF NOT EXISTS partners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  partner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, partner_id)
);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own partnerships" ON partners
    FOR ALL USING (auth.uid() = user_id OR auth.uid() = partner_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Partners kunnen elkaars recepten zien
DO $$ BEGIN
  CREATE POLICY "Partners view each others recipes" ON recipes
    FOR SELECT USING (
      user_id IN (
        SELECT partner_id FROM partners WHERE user_id = auth.uid()
        UNION
        SELECT user_id FROM partners WHERE partner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Partners kunnen elkaars voorraad zien EN bewerken
DO $$ BEGIN
  CREATE POLICY "Partners view each others pantry" ON pantry_items
    FOR SELECT USING (
      user_id IN (
        SELECT partner_id FROM partners WHERE user_id = auth.uid()
        UNION
        SELECT user_id FROM partners WHERE partner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Partners can add to each others pantry" ON pantry_items
    FOR INSERT WITH CHECK (
      user_id IN (
        SELECT partner_id FROM partners WHERE user_id = auth.uid()
        UNION
        SELECT user_id FROM partners WHERE partner_id = auth.uid()
      )
      OR auth.uid() = user_id
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Partners can delete from each others pantry" ON pantry_items
    FOR DELETE USING (
      user_id IN (
        SELECT partner_id FROM partners WHERE user_id = auth.uid()
        UNION
        SELECT user_id FROM partners WHERE partner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Meerdere supermarkten (array in plaats van enkele waarde)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_supermarkets text[] DEFAULT '{}';

-- Migreer bestaande enkele supermarkt naar array (alleen als kolom bestaat)
DO $$ BEGIN
  EXECUTE 'UPDATE profiles SET preferred_supermarkets = ARRAY[preferred_supermarket] WHERE preferred_supermarket IS NOT NULL AND preferred_supermarket != '''' AND (preferred_supermarkets IS NULL OR preferred_supermarkets = ''{}'')';
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
