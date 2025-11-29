-- Migration to optimize event filtering queries
-- Adds indexes for price filtering and JSONB location queries

-- Index on sport_type for category filtering
CREATE INDEX IF NOT EXISTS idx_events_sport_type ON events(sport_type);

-- GIN index on location JSONB for efficient city/state filtering
CREATE INDEX IF NOT EXISTS idx_events_location_gin ON events USING GIN (location);

-- Index on event_categories for price filtering
CREATE INDEX IF NOT EXISTS idx_event_categories_price ON event_categories(event_id, price);

-- Function to get minimum price for an event
CREATE OR REPLACE FUNCTION get_event_min_price(event_id UUID)
RETURNS DECIMAL(10, 2) AS $$
  SELECT MIN(price)
  FROM event_categories
  WHERE event_categories.event_id = get_event_min_price.event_id;
$$ LANGUAGE SQL STABLE;

-- Function to get maximum price for an event
CREATE OR REPLACE FUNCTION get_event_max_price(event_id UUID)
RETURNS DECIMAL(10, 2) AS $$
  SELECT MAX(price)
  FROM event_categories
  WHERE event_categories.event_id = get_event_max_price.event_id;
$$ LANGUAGE SQL STABLE;

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_events_status_start_date ON events(status, start_date);
CREATE INDEX IF NOT EXISTS idx_events_featured_status ON events(is_featured, status);

-- Index for efficient counting
CREATE INDEX IF NOT EXISTS idx_event_categories_count ON event_categories(event_id);

-- Create a materialized view for events with computed price ranges
CREATE MATERIALIZED VIEW IF NOT EXISTS events_with_prices AS
SELECT
  e.*,
  COALESCE(MIN(ec.price), 0) as min_price,
  COALESCE(MAX(ec.price), 0) as max_price
FROM events e
LEFT JOIN event_categories ec ON e.id = ec.event_id
GROUP BY e.id;

-- Index on the materialized view for efficient querying
CREATE INDEX IF NOT EXISTS idx_events_with_prices_min ON events_with_prices(min_price);
CREATE INDEX IF NOT EXISTS idx_events_with_prices_max ON events_with_prices(max_price);
CREATE INDEX IF NOT EXISTS idx_events_with_prices_status_date ON events_with_prices(status, start_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_with_prices_id ON events_with_prices(id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_events_with_prices()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY events_with_prices;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-refresh the view when events or categories change
CREATE TRIGGER refresh_events_prices_on_event_change
AFTER INSERT OR UPDATE OR DELETE ON events
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_events_with_prices();

CREATE TRIGGER refresh_events_prices_on_category_change
AFTER INSERT OR UPDATE OR DELETE ON event_categories
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_events_with_prices();

-- Comment on indexes
COMMENT ON INDEX idx_events_location_gin IS 'GIN index for fast JSONB queries on location (city, state)';
COMMENT ON INDEX idx_event_categories_price IS 'Composite index for price range filtering';
COMMENT ON FUNCTION get_event_min_price IS 'Returns minimum price across all categories for an event';
COMMENT ON FUNCTION get_event_max_price IS 'Returns maximum price across all categories for an event';
COMMENT ON MATERIALIZED VIEW events_with_prices IS 'Precomputed view of events with min/max prices for efficient filtering';
