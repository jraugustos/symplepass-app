-- Migration: Add ticket_code to registrations
-- Description: Adds a ticket_code column to store the human-readable code shown in QR codes

-- Add ticket_code column to registrations
ALTER TABLE registrations
    ADD COLUMN IF NOT EXISTS ticket_code TEXT;

COMMENT ON COLUMN registrations.ticket_code IS 'Human-readable ticket code displayed in QR code (e.g., EVENTO-A1B2C3D4)';

-- Index for quick lookup by ticket code
CREATE INDEX IF NOT EXISTS idx_registrations_ticket_code
    ON registrations(ticket_code);
