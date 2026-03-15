-- Zoek gebruikers op (gedeeltelijk) e-mailadres voor de deelfunctie
-- Geeft id, email en display_name terug (max 5 resultaten, exclusief de zoeker zelf)
CREATE OR REPLACE FUNCTION search_users_by_email(query_input text)
RETURNS TABLE(id uuid, email text, display_name text) AS $$
  SELECT
    u.id,
    u.email::text,
    p.display_name
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  WHERE u.email ILIKE '%' || query_input || '%'
    AND u.id != auth.uid()
  ORDER BY u.email
  LIMIT 5;
$$ LANGUAGE sql SECURITY DEFINER;
