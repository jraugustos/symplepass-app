-- Refresh the materialized view to ensure it has current data
-- This migration refreshes the events_with_prices view that is used for event filtering

-- First, refresh the materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY events_with_prices;

-- Verify the view has data
DO $$
DECLARE
  view_count INTEGER;
  event_count INTEGER;
BEGIN
  -- Count records in the materialized view
  SELECT COUNT(*) INTO view_count FROM events_with_prices;

  -- Count published events in the events table
  SELECT COUNT(*) INTO event_count FROM events WHERE status = 'published';

  -- Log the counts
  RAISE NOTICE 'Materialized view has % records', view_count;
  RAISE NOTICE 'Events table has % published events', event_count;

  -- If view is empty but events exist, force a refresh
  IF view_count = 0 AND event_count > 0 THEN
    RAISE NOTICE 'Forcing materialized view refresh...';
    REFRESH MATERIALIZED VIEW events_with_prices;
  END IF;
END $$;

-- Grant proper permissions on the materialized view
GRANT SELECT ON events_with_prices TO authenticated;
GRANT SELECT ON events_with_prices TO anon;