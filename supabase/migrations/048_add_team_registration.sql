-- Migration: Add Team Registration Support
-- This migration adds support for team registrations (more than 2 people)

-- Add new columns for team registration
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS allows_team_registration BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS team_size INTEGER;

-- Add constraint: team_size must be >= 2 when allows_team_registration is true
ALTER TABLE events
  ADD CONSTRAINT check_team_size
  CHECK (
    (allows_team_registration = TRUE AND team_size >= 2)
    OR allows_team_registration = FALSE
  );

-- Add comments for documentation
COMMENT ON COLUMN events.allows_team_registration IS 'Whether this event allows team registrations (more than 2 people)';
COMMENT ON COLUMN events.team_size IS 'Number of members required for team registration (must be >= 2)';

-- Refresh materialized view to include new columns
-- Note: Using non-concurrent refresh as the view may not have a unique index
REFRESH MATERIALIZED VIEW events_with_prices;
