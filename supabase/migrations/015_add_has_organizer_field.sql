-- Migration: Add has_organizer field to events
-- Allows events to optionally display organizer information

-- Add has_organizer column to events table
ALTER TABLE events
  ADD COLUMN has_organizer BOOLEAN NOT NULL DEFAULT TRUE;

-- Add comment for documentation
COMMENT ON COLUMN events.has_organizer IS 'Whether this event has/displays organizer information';