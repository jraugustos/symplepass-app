-- Migration: Add reminder_sent_at to registrations
-- Description: Track when event reminder emails were sent to avoid duplicate emails

-- Add reminder_sent_at column to registrations table
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for efficient querying of unsent reminders
CREATE INDEX IF NOT EXISTS idx_registrations_reminder_sent_at
ON registrations(reminder_sent_at)
WHERE reminder_sent_at IS NULL;

COMMENT ON COLUMN registrations.reminder_sent_at IS 'Timestamp when the event reminder email was sent to the user';
