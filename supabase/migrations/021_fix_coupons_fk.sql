-- Migration: Fix Coupons Schema FK Reference
-- Description: Ensures coupons and coupon_usages tables exist with correct FK references
-- Created: 2025-01-25
-- Issue: Migration 009 referenced non-existent table 'event_registrations' instead of 'registrations'
--        Also, coupons table may not have been created if migration 009 failed

-- ============================================================================
-- STEP 1: Create coupons table if it doesn't exist (from migration 009)
-- ============================================================================

CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value >= 0),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  current_uses INTEGER DEFAULT 0 NOT NULL CHECK (current_uses >= 0),
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'expired', 'disabled')),
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_date_range CHECK (valid_until > valid_from),
  CONSTRAINT valid_uses CHECK (current_uses <= COALESCE(max_uses, current_uses))
);

-- Add comments to coupons table
COMMENT ON TABLE coupons IS 'Coupon codes for discounts on event registrations';
COMMENT ON COLUMN coupons.code IS 'Unique coupon code (e.g., PROMO2025)';
COMMENT ON COLUMN coupons.discount_type IS 'Type of discount: percentage (0-100) or fixed amount in BRL';
COMMENT ON COLUMN coupons.discount_value IS 'Discount value: percentage (0-100) or fixed amount in BRL';
COMMENT ON COLUMN coupons.event_id IS 'Specific event ID or NULL for all events';
COMMENT ON COLUMN coupons.valid_from IS 'Coupon validity start date';
COMMENT ON COLUMN coupons.valid_until IS 'Coupon validity end date';
COMMENT ON COLUMN coupons.max_uses IS 'Maximum number of uses (NULL = unlimited)';
COMMENT ON COLUMN coupons.current_uses IS 'Current number of times the coupon has been used';
COMMENT ON COLUMN coupons.status IS 'Coupon status: active, expired, or disabled';
COMMENT ON COLUMN coupons.created_by IS 'Admin user who created the coupon';

-- Create indexes for coupons table if they don't exist
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_event_id ON coupons(event_id);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);

-- Enable RLS on coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Drop existing coupons policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Active coupons are viewable by everyone" ON coupons;
DROP POLICY IF EXISTS "Admins and organizers can view all coupons" ON coupons;
DROP POLICY IF EXISTS "Admins and organizers can create coupons" ON coupons;
DROP POLICY IF EXISTS "Admins and organizers can update coupons" ON coupons;
DROP POLICY IF EXISTS "Admins and organizers can delete coupons" ON coupons;

-- Recreate coupons RLS policies
CREATE POLICY "Active coupons are viewable by everyone"
  ON coupons FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins and organizers can view all coupons"
  ON coupons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
    )
  );

CREATE POLICY "Admins and organizers can create coupons"
  ON coupons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Admins and organizers can update coupons"
  ON coupons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
    )
  );

CREATE POLICY "Admins and organizers can delete coupons"
  ON coupons FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
    )
  );

-- ============================================================================
-- STEP 2: Drop the coupon_usages table with the incorrect FK (if it exists)
-- ============================================================================

-- First drop the indexes
DROP INDEX IF EXISTS idx_coupon_usages_coupon_id;
DROP INDEX IF EXISTS idx_coupon_usages_user_id;
DROP INDEX IF EXISTS idx_coupon_usages_registration_id;

-- Drop the table (may have incorrect FK to event_registrations)
DROP TABLE IF EXISTS coupon_usages;

-- ============================================================================
-- STEP 3: Recreate coupon_usages table with CORRECT FK reference to registrations
-- ============================================================================

CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  discount_applied DECIMAL(10, 2) NOT NULL CHECK (discount_applied >= 0),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_coupon_registration UNIQUE (coupon_id, registration_id)
);

-- Add comments
COMMENT ON TABLE coupon_usages IS 'Track coupon usage history';
COMMENT ON COLUMN coupon_usages.coupon_id IS 'Reference to the coupon that was used';
COMMENT ON COLUMN coupon_usages.user_id IS 'User who used the coupon';
COMMENT ON COLUMN coupon_usages.registration_id IS 'Registration where the coupon was applied';
COMMENT ON COLUMN coupon_usages.discount_applied IS 'Actual discount amount applied in BRL';
COMMENT ON COLUMN coupon_usages.used_at IS 'Timestamp when the coupon was used';

-- ============================================================================
-- STEP 4: Recreate indexes for coupon_usages
-- ============================================================================

CREATE INDEX idx_coupon_usages_coupon_id ON coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_user_id ON coupon_usages(user_id);
CREATE INDEX idx_coupon_usages_registration_id ON coupon_usages(registration_id);

-- ============================================================================
-- STEP 5: Enable RLS and recreate policies for coupon_usages
-- ============================================================================

ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

-- Users can view their own coupon usages
CREATE POLICY "Users can view own coupon usages"
  ON coupon_usages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins and organizers can view all coupon usages
CREATE POLICY "Admins and organizers can view all coupon usages"
  ON coupon_usages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
    )
  );

-- Authenticated users can create coupon usages (during checkout)
CREATE POLICY "Authenticated users can create coupon usages"
  ON coupon_usages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- STEP 6: Create helper functions for coupons (from migration 009)
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on coupons table
DROP TRIGGER IF EXISTS update_coupons_updated_at_trigger ON coupons;
CREATE TRIGGER update_coupons_updated_at_trigger
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_coupons_updated_at();

-- Function to automatically update coupon status to expired
CREATE OR REPLACE FUNCTION update_expired_coupons()
RETURNS void AS $$
BEGIN
  UPDATE coupons
  SET status = 'expired'
  WHERE status = 'active'
  AND valid_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to atomically increment coupon uses
CREATE OR REPLACE FUNCTION increment_coupon_uses(coupon_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE coupons
  SET current_uses = current_uses + 1
  WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql;
