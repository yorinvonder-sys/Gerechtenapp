-- Voeg onboarding-velden toe aan de profiles tabel
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS household_size integer,
  ADD COLUMN IF NOT EXISTS allergies text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dislikes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cooking_level text,
  ADD COLUMN IF NOT EXISTS preferred_cooking_time text;
