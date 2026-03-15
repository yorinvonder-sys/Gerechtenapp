-- Gedeelde gebruikers mogen ook maaltijden toevoegen/wijzigen/verwijderen
-- (bidirectioneel: als A deelt met B, kan B ook bewerken)

-- Shared users can INSERT meal plans for the owner
CREATE POLICY "Shared users can add meals" ON meal_plans
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT owner_id FROM shared_meal_plans WHERE shared_with = auth.uid()
      UNION
      SELECT shared_with FROM shared_meal_plans WHERE owner_id = auth.uid()
    )
    OR auth.uid() = user_id
  );

-- Shared users can UPDATE meal plans
CREATE POLICY "Shared users can update meals" ON meal_plans
  FOR UPDATE USING (
    user_id IN (
      SELECT owner_id FROM shared_meal_plans WHERE shared_with = auth.uid()
      UNION
      SELECT shared_with FROM shared_meal_plans WHERE owner_id = auth.uid()
    )
  );

-- Shared users can DELETE meal plans
CREATE POLICY "Shared users can delete meals" ON meal_plans
  FOR DELETE USING (
    user_id IN (
      SELECT owner_id FROM shared_meal_plans WHERE shared_with = auth.uid()
      UNION
      SELECT shared_with FROM shared_meal_plans WHERE owner_id = auth.uid()
    )
  );

-- Shared users can also view plans from people they shared with (bidirectional)
CREATE POLICY "Users view plans from people they shared with" ON meal_plans
  FOR SELECT USING (
    user_id IN (
      SELECT shared_with FROM shared_meal_plans WHERE owner_id = auth.uid()
    )
  );

-- Bidirectional sharing: if A shares with B, B also sees in their shared list
CREATE POLICY "Users see who shared with them" ON shared_meal_plans
  FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = shared_with);

-- Helper function to find user by email (for sharing)
CREATE OR REPLACE FUNCTION get_user_id_by_email(email_input text)
RETURNS uuid AS $$
  SELECT id FROM auth.users WHERE email = email_input LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
