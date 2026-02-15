-- Migration: Add Mercado Pago payment integration fields
-- Purpose: Support Mercado Pago Checkout Pro for event registrations and photo orders
-- while maintaining backward compatibility with existing Stripe payments.
--
-- NOTE: Subscriptions remain on Stripe — no changes to the subscriptions table.
--
-- Apply manually: Run this in the Supabase SQL Editor or via `supabase db push`
-- DO NOT run automatically against production without review.

-- ============================================================
-- REGISTRATIONS TABLE
-- ============================================================

-- Mercado Pago Preference ID (created during checkout initiation)
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS mp_preference_id TEXT;

-- Mercado Pago Payment ID (received via webhook after payment)
-- Note: MP uses numeric IDs (BIGINT), unlike Stripe's string-based IDs
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS mp_payment_id BIGINT;

-- Payment provider indicator for multi-gateway support
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS payment_provider TEXT NOT NULL DEFAULT 'stripe';

-- Add constraint for valid payment providers
ALTER TABLE registrations
  ADD CONSTRAINT chk_registrations_payment_provider
  CHECK (payment_provider IN ('stripe', 'mercadopago', 'free'));

-- Indexes for webhook lookups (MP sends payment ID, we need fast lookup)
CREATE INDEX IF NOT EXISTS idx_registrations_mp_preference_id
  ON registrations(mp_preference_id)
  WHERE mp_preference_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_mp_payment_id
  ON registrations(mp_payment_id)
  WHERE mp_payment_id IS NOT NULL;

-- Update existing free/solidarity registrations to use 'free' provider
UPDATE registrations
  SET payment_provider = 'free'
  WHERE (amount_paid = 0 OR amount_paid IS NULL)
    AND payment_status = 'free';

-- Comments for documentation
COMMENT ON COLUMN registrations.mp_preference_id IS 'Mercado Pago Preference ID — generated when checkout is initiated';
COMMENT ON COLUMN registrations.mp_payment_id IS 'Mercado Pago Payment ID — received via webhook after payment completion';
COMMENT ON COLUMN registrations.payment_provider IS 'Payment gateway used: stripe (legacy), mercadopago (new), free (no payment)';


-- ============================================================
-- PHOTO_ORDERS TABLE
-- ============================================================

-- Mercado Pago Preference ID
ALTER TABLE photo_orders
  ADD COLUMN IF NOT EXISTS mp_preference_id TEXT;

-- Mercado Pago Payment ID (numeric)
ALTER TABLE photo_orders
  ADD COLUMN IF NOT EXISTS mp_payment_id BIGINT;

-- Payment provider indicator
ALTER TABLE photo_orders
  ADD COLUMN IF NOT EXISTS payment_provider TEXT NOT NULL DEFAULT 'stripe';

-- Add constraint for valid payment providers
ALTER TABLE photo_orders
  ADD CONSTRAINT chk_photo_orders_payment_provider
  CHECK (payment_provider IN ('stripe', 'mercadopago'));

-- Indexes for webhook lookups
CREATE INDEX IF NOT EXISTS idx_photo_orders_mp_preference_id
  ON photo_orders(mp_preference_id)
  WHERE mp_preference_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_photo_orders_mp_payment_id
  ON photo_orders(mp_payment_id)
  WHERE mp_payment_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN photo_orders.mp_preference_id IS 'Mercado Pago Preference ID — generated when checkout is initiated';
COMMENT ON COLUMN photo_orders.mp_payment_id IS 'Mercado Pago Payment ID — received via webhook after payment completion';
COMMENT ON COLUMN photo_orders.payment_provider IS 'Payment gateway used: stripe (legacy) or mercadopago (new)';
