-- Migration: Add event_format to events
-- Adds enum for event format and column on events table

-- Create event_format enum
CREATE TYPE event_format AS ENUM ('presencial', 'online', 'workshop', 'hibrido');

-- Add new column to events table with default
ALTER TABLE events
  ADD COLUMN event_format event_format NOT NULL DEFAULT 'presencial';

-- Document the column
COMMENT ON COLUMN events.event_format IS 'Formato do evento: presencial, online, workshop ou hibrido';

-- Ensure existing records have the default value
UPDATE events SET event_format = 'presencial' WHERE event_format IS NULL;
