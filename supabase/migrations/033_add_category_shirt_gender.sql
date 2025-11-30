-- Migration: Add shirt_genders to event_categories
-- This allows categories to be associated with specific shirt genders (supports multiple)
-- When null or empty, all genders are available for that category

-- Add shirt_genders column as TEXT array to event_categories
ALTER TABLE event_categories
ADD COLUMN IF NOT EXISTS shirt_genders TEXT[] DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN event_categories.shirt_genders IS 'Optional gender restrictions for shirt sizes. Array of genders (masculino, feminino, infantil). When NULL or empty, all genders are available.';
