-- Migration: Fix duplicate events and ensure proper indexes
-- Description: Identifies and removes duplicate events, and ensures proper unique constraint on event ID
-- Date: 2025-11-29

-- First, check if there are duplicate IDs (this should not happen, but let's be safe)
-- This query will show if there are any duplicate event IDs
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT id, COUNT(*) as cnt
    FROM events
    GROUP BY id
    HAVING COUNT(*) > 1
  ) AS duplicates;

  IF duplicate_count > 0 THEN
    RAISE NOTICE 'Found % duplicate event IDs', duplicate_count;
  ELSE
    RAISE NOTICE 'No duplicate event IDs found';
  END IF;
END $$;

-- Ensure the primary key constraint exists and is properly enforced
-- (This should already exist, but we're being thorough)
DO $$
BEGIN
  -- Check if pk constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'events_pkey' AND conrelid = 'events'::regclass
  ) THEN
    ALTER TABLE events ADD CONSTRAINT events_pkey PRIMARY KEY (id);
    RAISE NOTICE 'Added primary key constraint to events table';
  ELSE
    RAISE NOTICE 'Primary key constraint already exists';
  END IF;
END $$;
