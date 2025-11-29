-- Migration: Add shirt_sizes to events
-- Adds JSONB array column to store configurable shirt sizes per event

-- Add new column to events table with default
ALTER TABLE events
  ADD COLUMN shirt_sizes JSONB NOT NULL DEFAULT '["P", "M", "G", "GG", "XG"]'::JSONB;

-- Document the column
COMMENT ON COLUMN events.shirt_sizes IS 'Array of available shirt sizes for this event, in display order';

-- Ensure existing records have the default value
UPDATE events SET shirt_sizes = '["P", "M", "G", "GG", "XG"]'::JSONB WHERE shirt_sizes IS NULL;
