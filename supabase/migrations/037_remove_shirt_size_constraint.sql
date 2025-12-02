-- Migration: Remove shirt_size constraint to allow custom sizes
-- The system now supports custom shirt sizes per event (shirt_sizes_config)
-- so we need to remove the hardcoded constraint

-- Drop the old constraint
ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_shirt_size_check;

-- Add a more permissive constraint (just ensure it's not empty if provided)
ALTER TABLE registrations ADD CONSTRAINT registrations_shirt_size_check
  CHECK (shirt_size IS NULL OR length(trim(shirt_size)) > 0);

COMMENT ON COLUMN registrations.shirt_size IS 'Selected shirt size for the registration. Can be any value configured in the event shirt_sizes_config.';
