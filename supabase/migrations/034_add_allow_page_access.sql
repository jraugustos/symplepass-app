-- Migration: Add allow_page_access field for events with published_no_registration status
-- This field controls whether users can access the event page when the event is published without registration

-- Add the allow_page_access column with default true (for backwards compatibility)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS allow_page_access BOOLEAN DEFAULT TRUE;

-- Add comment for documentation
COMMENT ON COLUMN events.allow_page_access IS 'When false and status is published_no_registration, the event page is not accessible and buttons show "Em breve"';

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

-- Create index for performance
CREATE UNIQUE INDEX IF NOT EXISTS events_with_prices_id_idx ON events_with_prices(id);
CREATE INDEX IF NOT EXISTS events_with_prices_status_idx ON events_with_prices(status);
CREATE INDEX IF NOT EXISTS events_with_prices_is_featured_idx ON events_with_prices(is_featured);
