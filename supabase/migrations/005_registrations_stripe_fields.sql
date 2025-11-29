-- Migration: Registrations Stripe Integration
-- Description: Adds Stripe metadata fields to registrations, relaxes CPF requirement, and updates constraints

-- Add Stripe-related fields to registrations for checkout tracking
ALTER TABLE registrations
    ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
    ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
    ADD COLUMN IF NOT EXISTS qr_code TEXT,
    ADD COLUMN IF NOT EXISTS shirt_size TEXT CHECK (
        shirt_size IS NULL OR shirt_size IN ('P', 'M', 'G', 'GG', 'XG')
    );

COMMENT ON COLUMN registrations.stripe_session_id IS 'Stripe Checkout Session identifier for reconciling payments';
COMMENT ON COLUMN registrations.stripe_payment_intent_id IS 'Stripe Payment Intent identifier for payment confirmations';
COMMENT ON COLUMN registrations.qr_code IS 'QR code payload for on-site validation';
COMMENT ON COLUMN registrations.shirt_size IS 'Selected shirt size for the registration (P, M, G, GG, XG)';

-- Index for quick lookup during webhook processing
CREATE INDEX IF NOT EXISTS idx_registrations_stripe_session_id
    ON registrations(stripe_session_id);

-- Allow quick signup without CPF while maintaining uniqueness
ALTER TABLE profiles
    ALTER COLUMN cpf DROP NOT NULL;

-- Update uniqueness constraint to allow multiple category registrations per user
ALTER TABLE registrations
    DROP CONSTRAINT IF EXISTS registrations_event_id_user_id_key;

ALTER TABLE registrations
    ADD CONSTRAINT registrations_event_id_user_id_category_id_key
        UNIQUE (event_id, user_id, category_id);
