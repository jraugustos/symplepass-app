-- Migration: Remove duplicate events if any exist
-- Description: Identifies and removes duplicate event records, keeping only the most recent one
-- Date: 2025-11-29

-- First, let's see if there are duplicates
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  -- Count duplicate events
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT id
    FROM events
    GROUP BY id
    HAVING COUNT(*) > 1
  ) AS dups;

  IF duplicate_count > 0 THEN
    RAISE NOTICE 'Found % duplicate event IDs', duplicate_count;

    -- Delete duplicates, keeping only the one with the latest updated_at
    -- This uses the ctid (physical row identifier) to break ties
    DELETE FROM events a
    USING (
      SELECT id, MAX(ctid) as keep_ctid
      FROM events
      GROUP BY id
      HAVING COUNT(*) > 1
    ) b
    WHERE a.id = b.id
    AND a.ctid != b.keep_ctid;

    RAISE NOTICE 'Deleted % duplicate event records', duplicate_count;
  ELSE
    RAISE NOTICE 'No duplicate events found - database is clean!';
  END IF;
END $$;

-- After cleaning, let's verify the table structure
DO $$
BEGIN
  -- Ensure primary key exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'events_pkey'
  ) THEN
    ALTER TABLE events ADD CONSTRAINT events_pkey PRIMARY KEY (id);
    RAISE NOTICE 'Added primary key constraint';
  ELSE
    RAISE NOTICE 'Primary key constraint already exists';
  END IF;
END $$;

-- Show final count
DO $$
DECLARE
  total_events INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_events FROM events;
  RAISE NOTICE 'Total events in database: %', total_events;
END $$;
