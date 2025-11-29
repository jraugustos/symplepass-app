-- Migration: Add 'published_no_registration' status to events table
-- Description: Adds a new status that allows events to be published and visible to users,
--              but prevents registrations from being created. This allows admins to launch
--              an event for visibility while keeping registrations closed.
-- Date: 2025-11-29

-- Drop the existing CHECK constraint on status
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;

-- Add the new CHECK constraint with the additional 'published_no_registration' value
ALTER TABLE events ADD CONSTRAINT events_status_check
  CHECK (status IN ('draft', 'published', 'published_no_registration', 'cancelled', 'completed'));
