-- Migration: Add allows_individual_registration field
-- Allows events to disable individual registrations (only pairs allowed)

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS allows_individual_registration BOOLEAN NOT NULL DEFAULT TRUE;

-- Add comment for documentation
COMMENT ON COLUMN events.allows_individual_registration IS 'Whether this event allows individual registrations. When false, only pair registrations are allowed.';

-- Update the materialized view to include the new field
DROP MATERIALIZED VIEW IF EXISTS events_with_prices;

CREATE MATERIALIZED VIEW events_with_prices AS
SELECT
    e.*,
    COALESCE(MIN(ec.price), 0) as min_price,
    COALESCE(MAX(ec.price), 0) as max_price
FROM events e
LEFT JOIN event_categories ec ON e.id = ec.event_id
GROUP BY e.id;

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS events_with_prices_id_idx ON events_with_prices(id);
CREATE INDEX IF NOT EXISTS events_with_prices_status_idx ON events_with_prices(status);
CREATE INDEX IF NOT EXISTS events_with_prices_is_featured_idx ON events_with_prices(is_featured);
