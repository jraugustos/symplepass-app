-- Migration: Event Types and Pair Registration
-- Adds support for free, solidarity, and paid events
-- Adds support for pair registration (doubles)

-- Create event_type enum
CREATE TYPE event_type AS ENUM ('paid', 'free', 'solidarity');

-- Add new columns to events table
ALTER TABLE events
  ADD COLUMN event_type event_type NOT NULL DEFAULT 'paid',
  ADD COLUMN solidarity_message TEXT,
  ADD COLUMN allows_pair_registration BOOLEAN NOT NULL DEFAULT FALSE;

-- Add constraint: solidarity_message is required when event_type is 'solidarity'
ALTER TABLE events
  ADD CONSTRAINT check_solidarity_message 
  CHECK (
    (event_type = 'solidarity' AND solidarity_message IS NOT NULL AND solidarity_message != '') 
    OR event_type != 'solidarity'
  );

-- Add new columns to registrations table for pair registration
ALTER TABLE registrations
  ADD COLUMN partner_name TEXT,
  ADD COLUMN is_partner_registration BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for partner registrations
CREATE INDEX idx_registrations_partner ON registrations(is_partner_registration) WHERE is_partner_registration = TRUE;

-- Update existing events to be 'paid' type (already set by DEFAULT, but explicit for clarity)
UPDATE events SET event_type = 'paid' WHERE event_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN events.event_type IS 'Type of event: paid (requires payment), free (no payment), solidarity (no payment but with requirement message)';
COMMENT ON COLUMN events.solidarity_message IS 'Message describing solidarity requirements (e.g., "mediante doação de 1kg de alimento")';
COMMENT ON COLUMN events.allows_pair_registration IS 'Whether this event allows pair/double registrations';
COMMENT ON COLUMN registrations.partner_name IS 'Name of partner for pair registrations';
COMMENT ON COLUMN registrations.is_partner_registration IS 'Whether this registration includes a partner';
