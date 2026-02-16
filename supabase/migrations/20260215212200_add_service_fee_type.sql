-- Add service_fee_type column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS service_fee_type TEXT CHECK (service_fee_type IN ('percentage', 'fixed')) DEFAULT 'percentage';

COMMENT ON COLUMN events.service_fee_type IS 'Type of service fee: percentage or fixed value';
