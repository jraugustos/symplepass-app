-- Migration: Photo Pricing Tiers
-- Description: Migrate from fixed photo packages to progressive pricing tiers
-- Created: 2025-01-XX
--
-- New pricing model:
-- Instead of fixed packages like "3 Fotos R$35" where user pays full package price,
-- we now have progressive tiers like "3+ fotos = R$7/each" where user pays exactly
-- for the quantity they select.
--
-- Example tiers:
-- - 1+ photos: R$10.00 per photo
-- - 3+ photos: R$7.00 per photo
-- - 10+ photos: R$5.00 per photo
--
-- User selecting 5 photos pays: 5 x R$7.00 = R$35.00 (uses 3+ tier)

-- ============================================================
-- TABLE: photo_pricing_tiers
-- Description: Progressive pricing tiers for photo purchases
-- ============================================================
CREATE TABLE IF NOT EXISTS photo_pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  min_quantity INTEGER NOT NULL,           -- Minimum photos to activate tier (1, 3, 10)
  price_per_photo DECIMAL(10, 2) NOT NULL, -- Price per photo at this tier
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT photo_pricing_tiers_min_quantity_positive CHECK (min_quantity > 0),
  CONSTRAINT photo_pricing_tiers_price_non_negative CHECK (price_per_photo >= 0),
  CONSTRAINT photo_pricing_tiers_unique_min_qty UNIQUE (event_id, min_quantity)
);

COMMENT ON TABLE photo_pricing_tiers IS 'Progressive pricing tiers for photo purchases. Each event can have multiple tiers with different prices based on quantity';
COMMENT ON COLUMN photo_pricing_tiers.min_quantity IS 'Minimum number of photos required to activate this pricing tier';
COMMENT ON COLUMN photo_pricing_tiers.price_per_photo IS 'Price per photo in BRL when this tier is active';
COMMENT ON COLUMN photo_pricing_tiers.display_order IS 'Order for display in selection UI, lower numbers appear first';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_photo_pricing_tiers_event_id ON photo_pricing_tiers(event_id);
CREATE INDEX IF NOT EXISTS idx_photo_pricing_tiers_lookup ON photo_pricing_tiers(event_id, min_quantity DESC);

-- Enable RLS
ALTER TABLE photo_pricing_tiers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: photo_pricing_tiers
-- Same pattern as photo_packages
-- ============================================================

-- SELECT: Public can view tiers of published events, organizers/admins see their events
CREATE POLICY "photo_pricing_tiers_select_policy" ON photo_pricing_tiers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = photo_pricing_tiers.event_id
      AND events.status IN ('published', 'published_no_registration', 'completed')
    )
    OR
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = photo_pricing_tiers.event_id
      AND events.organizer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- INSERT: Only organizers of the event or admins
CREATE POLICY "photo_pricing_tiers_insert_policy" ON photo_pricing_tiers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = photo_pricing_tiers.event_id
      AND events.organizer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- UPDATE: Only organizers of the event or admins
CREATE POLICY "photo_pricing_tiers_update_policy" ON photo_pricing_tiers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = photo_pricing_tiers.event_id
      AND events.organizer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- DELETE: Only organizers of the event or admins
CREATE POLICY "photo_pricing_tiers_delete_policy" ON photo_pricing_tiers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = photo_pricing_tiers.event_id
      AND events.organizer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- TRIGGER: updated_at
-- ============================================================
CREATE TRIGGER photo_pricing_tiers_updated_at
  BEFORE UPDATE ON photo_pricing_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_tables_updated_at();

-- ============================================================
-- DATA MIGRATION: Convert packages to pricing tiers
-- Strategy: For each package, create a tier where:
-- - min_quantity = package.quantity
-- - price_per_photo = package.price / package.quantity
-- ============================================================
INSERT INTO photo_pricing_tiers (event_id, min_quantity, price_per_photo, display_order)
SELECT
  event_id,
  quantity as min_quantity,
  ROUND(price / quantity, 2) as price_per_photo,
  display_order
FROM photo_packages
ON CONFLICT (event_id, min_quantity) DO NOTHING;

-- ============================================================
-- ALTER photo_orders: Add new columns for tier tracking
-- ============================================================
ALTER TABLE photo_orders
ADD COLUMN IF NOT EXISTS applied_tier_id UUID REFERENCES photo_pricing_tiers(id) ON DELETE SET NULL;

ALTER TABLE photo_orders
ADD COLUMN IF NOT EXISTS price_per_photo_applied DECIMAL(10, 2);

COMMENT ON COLUMN photo_orders.applied_tier_id IS 'Reference to the pricing tier that was applied to this order';
COMMENT ON COLUMN photo_orders.price_per_photo_applied IS 'The price per photo that was applied at checkout time (for audit purposes)';

-- ============================================================
-- DEPRECATION NOTE
-- ============================================================
-- The photo_packages table is now deprecated but kept for:
-- 1. Backward compatibility with existing orders that reference package_id
-- 2. Historical data preservation
--
-- New orders should use:
-- - applied_tier_id: Reference to the pricing tier used
-- - price_per_photo_applied: The actual price per photo at checkout time
--
-- The package_id column in photo_orders is deprecated and will be NULL for new orders.

COMMENT ON TABLE photo_packages IS 'DEPRECATED: Use photo_pricing_tiers instead. This table is kept for backward compatibility with existing orders that reference package_id.';
COMMENT ON COLUMN photo_orders.package_id IS 'DEPRECATED: Use applied_tier_id instead. Kept for backward compatibility with existing orders.';
