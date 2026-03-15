-- Add image_url column to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_url text;
