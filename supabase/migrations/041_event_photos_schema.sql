-- Migration: Event Photos Schema
-- Description: Create tables and storage for event photo sales feature
-- Created: 2025-01-XX
--
-- Storage Structure:
-- event-photos/ (PRIVATE - download only after payment)
-- └── {event-id}/
--     ├── photo-{uuid}.jpg
--     └── ...
--
-- event-photos-watermarked/ (PUBLIC - preview with watermark)
-- └── {event-id}/
--     ├── watermarked/
--     │   ├── photo-{uuid}.jpg
--     │   └── ...
--     └── thumbnails/
--         ├── photo-{uuid}.jpg
--         └── ...

-- ============================================================
-- TABLE: event_photos
-- Description: Stores metadata for photos uploaded to events
-- ============================================================
CREATE TABLE IF NOT EXISTS event_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  original_path TEXT NOT NULL,           -- Path to original high-res photo (private bucket)
  watermarked_path TEXT NOT NULL,        -- Path to watermarked version (public bucket)
  thumbnail_path TEXT NOT NULL,          -- Path to thumbnail version (public bucket)
  file_name TEXT NOT NULL,               -- Original file name for display
  file_size BIGINT NOT NULL,             -- File size in bytes
  width INTEGER,                         -- Image width in pixels
  height INTEGER,                        -- Image height in pixels
  display_order INTEGER NOT NULL DEFAULT 0, -- Order for gallery display
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE event_photos IS 'Stores metadata for photos uploaded to events for sale';
COMMENT ON COLUMN event_photos.original_path IS 'Path to original high-resolution photo in private event-photos bucket';
COMMENT ON COLUMN event_photos.watermarked_path IS 'Path to watermarked version in public event-photos-watermarked bucket';
COMMENT ON COLUMN event_photos.thumbnail_path IS 'Path to thumbnail version in public event-photos-watermarked bucket';
COMMENT ON COLUMN event_photos.file_name IS 'Original file name for display purposes';
COMMENT ON COLUMN event_photos.file_size IS 'Original file size in bytes';
COMMENT ON COLUMN event_photos.display_order IS 'Order for gallery display, lower numbers appear first';

-- Indexes for event_photos
CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_display_order ON event_photos(event_id, display_order);

-- ============================================================
-- TABLE: photo_packages
-- Description: Pricing packages for photo purchases (e.g., "1 photo R$10", "3 photos R$25")
-- ============================================================
CREATE TABLE IF NOT EXISTS photo_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- Package name (e.g., "1 Foto", "Pacote 3 Fotos")
  quantity INTEGER NOT NULL,             -- Number of photos in package
  price DECIMAL(10, 2) NOT NULL,         -- Price in BRL
  display_order INTEGER NOT NULL DEFAULT 0, -- Order for display in selection
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT photo_packages_quantity_positive CHECK (quantity > 0),
  CONSTRAINT photo_packages_price_non_negative CHECK (price >= 0)
);

COMMENT ON TABLE photo_packages IS 'Pricing packages for photo purchases. Each event can have multiple packages with different quantities and prices';
COMMENT ON COLUMN photo_packages.name IS 'Display name for the package (e.g., "1 Foto", "Pacote 3 Fotos")';
COMMENT ON COLUMN photo_packages.quantity IS 'Number of photos included in this package';
COMMENT ON COLUMN photo_packages.price IS 'Price in BRL for this package';
COMMENT ON COLUMN photo_packages.display_order IS 'Order for display in selection UI, lower numbers appear first';

-- Indexes for photo_packages
CREATE INDEX IF NOT EXISTS idx_photo_packages_event_id ON photo_packages(event_id);
CREATE INDEX IF NOT EXISTS idx_photo_packages_quantity ON photo_packages(event_id, quantity);

-- ============================================================
-- TABLE: photo_orders
-- Description: Orders for photo purchases, following registrations table pattern
-- ============================================================
CREATE TABLE IF NOT EXISTS photo_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,  -- Total amount paid
  package_id UUID REFERENCES photo_packages(id) ON DELETE SET NULL, -- Package used (if any)
  stripe_session_id TEXT,                -- Stripe Checkout session ID
  stripe_payment_intent_id TEXT,         -- Stripe PaymentIntent ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT photo_orders_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  CONSTRAINT photo_orders_payment_status_check CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'))
);

COMMENT ON TABLE photo_orders IS 'Orders for photo purchases. Follows the same pattern as registrations table for Stripe integration';
COMMENT ON COLUMN photo_orders.status IS 'Order status: pending, confirmed, or cancelled';
COMMENT ON COLUMN photo_orders.payment_status IS 'Payment status: pending, paid, failed, or refunded';
COMMENT ON COLUMN photo_orders.total_amount IS 'Total amount paid in BRL';
COMMENT ON COLUMN photo_orders.package_id IS 'Reference to photo_packages if a package was used, NULL for custom selections';
COMMENT ON COLUMN photo_orders.stripe_session_id IS 'Stripe Checkout session ID for payment tracking';
COMMENT ON COLUMN photo_orders.stripe_payment_intent_id IS 'Stripe PaymentIntent ID for payment tracking and refunds';

-- Indexes for photo_orders
CREATE INDEX IF NOT EXISTS idx_photo_orders_event_id ON photo_orders(event_id);
CREATE INDEX IF NOT EXISTS idx_photo_orders_user_id ON photo_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_orders_stripe_session_id ON photo_orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_photo_orders_payment_status ON photo_orders(payment_status);

-- ============================================================
-- TABLE: photo_order_items
-- Description: Individual photos in each order (N:N relationship)
-- ============================================================
CREATE TABLE IF NOT EXISTS photo_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES photo_orders(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES event_photos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT photo_order_items_unique UNIQUE (order_id, photo_id)
);

COMMENT ON TABLE photo_order_items IS 'Individual photos included in each order. Creates N:N relationship between orders and photos';
COMMENT ON COLUMN photo_order_items.order_id IS 'Reference to the photo_orders table';
COMMENT ON COLUMN photo_order_items.photo_id IS 'Reference to the event_photos table';

-- Indexes for photo_order_items
CREATE INDEX IF NOT EXISTS idx_photo_order_items_order_id ON photo_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_photo_order_items_photo_id ON photo_order_items(photo_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Bucket: event-photos (PRIVATE - original high-resolution photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-photos',
  'event-photos',
  false, -- PRIVATE - only accessible after payment
  52428800, -- 50MB (high-resolution photos)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Bucket: event-photos-watermarked (PUBLIC - watermarked and thumbnail versions)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-photos-watermarked',
  'event-photos-watermarked',
  true, -- PUBLIC - anyone can view watermarked photos
  10485760, -- 10MB (compressed photos)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- ============================================================
-- RLS POLICIES - TABLES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_order_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: event_photos
-- ============================================================

-- SELECT: Public can view photos of published events, organizers/admins see their events
CREATE POLICY "event_photos_select_policy" ON event_photos
  FOR SELECT USING (
    -- Anyone can see photos of published events
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_photos.event_id
      AND events.status IN ('published', 'published_no_registration', 'completed')
    )
    OR
    -- Organizers can see their event photos
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_photos.event_id
      AND events.organizer_id = auth.uid()
    )
    OR
    -- Admins can see all photos
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- INSERT: Only organizers of the event or admins
CREATE POLICY "event_photos_insert_policy" ON event_photos
  FOR INSERT WITH CHECK (
    -- Organizers can insert to their events
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_photos.event_id
      AND events.organizer_id = auth.uid()
    )
    OR
    -- Admins can insert to any event
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- UPDATE: Only organizers of the event or admins
CREATE POLICY "event_photos_update_policy" ON event_photos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_photos.event_id
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
CREATE POLICY "event_photos_delete_policy" ON event_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_photos.event_id
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
-- RLS POLICIES: photo_packages
-- ============================================================

-- SELECT: Public can view packages of published events, organizers/admins see their events
CREATE POLICY "photo_packages_select_policy" ON photo_packages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = photo_packages.event_id
      AND events.status IN ('published', 'published_no_registration', 'completed')
    )
    OR
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = photo_packages.event_id
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
CREATE POLICY "photo_packages_insert_policy" ON photo_packages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = photo_packages.event_id
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
CREATE POLICY "photo_packages_update_policy" ON photo_packages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = photo_packages.event_id
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
CREATE POLICY "photo_packages_delete_policy" ON photo_packages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = photo_packages.event_id
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
-- RLS POLICIES: photo_orders
-- ============================================================

-- SELECT: Users see their own orders, organizers/admins see orders for their events
CREATE POLICY "photo_orders_select_policy" ON photo_orders
  FOR SELECT USING (
    -- Users can see their own orders
    user_id = auth.uid()
    OR
    -- Organizers can see orders for their events
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = photo_orders.event_id
      AND events.organizer_id = auth.uid()
    )
    OR
    -- Admins can see all orders
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- INSERT: Authenticated users can create orders for themselves
CREATE POLICY "photo_orders_insert_policy" ON photo_orders
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- UPDATE: Users can update their own pending orders, organizers/admins can update orders for their events
CREATE POLICY "photo_orders_update_policy" ON photo_orders
  FOR UPDATE USING (
    -- Users can update their own pending orders
    (user_id = auth.uid() AND status = 'pending')
    OR
    -- Organizers can update orders for their events
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = photo_orders.event_id
      AND events.organizer_id = auth.uid()
    )
    OR
    -- Admins can update any order
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- RLS POLICIES: photo_order_items
-- ============================================================

-- SELECT: Through JOIN with photo_orders (same access rules)
CREATE POLICY "photo_order_items_select_policy" ON photo_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM photo_orders
      WHERE photo_orders.id = photo_order_items.order_id
      AND (
        photo_orders.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM events
          WHERE events.id = photo_orders.event_id
          AND events.organizer_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- INSERT: Only when user owns the order
CREATE POLICY "photo_order_items_insert_policy" ON photo_order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM photo_orders
      WHERE photo_orders.id = photo_order_items.order_id
      AND photo_orders.user_id = auth.uid()
      AND photo_orders.status = 'pending'
    )
  );

-- DELETE: Only when user owns the order and it's pending
CREATE POLICY "photo_order_items_delete_policy" ON photo_order_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM photo_orders
      WHERE photo_orders.id = photo_order_items.order_id
      AND photo_orders.user_id = auth.uid()
      AND photo_orders.status = 'pending'
    )
  );

-- ============================================================
-- RLS POLICIES - STORAGE
-- ============================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "event_photos_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "event_photos_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "event_photos_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "event_photos_download_policy" ON storage.objects;
DROP POLICY IF EXISTS "event_photos_watermarked_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "event_photos_watermarked_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "event_photos_watermarked_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "event_photos_watermarked_delete_policy" ON storage.objects;

-- ============================================================
-- STORAGE POLICIES: event-photos (PRIVATE)
-- Path structure: {event-id}/photo-{uuid}.jpg
-- ============================================================

-- Upload: Admins can upload to any event, organizers only to their events
CREATE POLICY "event_photos_upload_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event-photos'
    AND (
      -- Admins can upload to any event
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
      OR
      -- Organizers can upload to their events
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id::text = (storage.foldername(name))[1]
        AND events.organizer_id = auth.uid()
      )
    )
  );

-- Update: Same rules as upload
CREATE POLICY "event_photos_storage_update_policy" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'event-photos'
    AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
      OR
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id::text = (storage.foldername(name))[1]
        AND events.organizer_id = auth.uid()
      )
    )
  );

-- Delete: Same rules as upload
CREATE POLICY "event_photos_storage_delete_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'event-photos'
    AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
      OR
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id::text = (storage.foldername(name))[1]
        AND events.organizer_id = auth.uid()
      )
    )
  );

-- Download: Only users with paid orders can download specific photos, or admins/organizers
CREATE POLICY "event_photos_download_policy" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'event-photos'
    AND (
      -- Admins can download any photo
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
      OR
      -- Organizers can download photos from their events
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id::text = (storage.foldername(name))[1]
        AND events.organizer_id = auth.uid()
      )
      OR
      -- Users with paid orders can download their purchased photos
      EXISTS (
        SELECT 1 FROM photo_order_items
        JOIN photo_orders ON photo_orders.id = photo_order_items.order_id
        JOIN event_photos ON event_photos.id = photo_order_items.photo_id
        WHERE photo_orders.user_id = auth.uid()
        AND photo_orders.payment_status = 'paid'
        AND event_photos.original_path = name
      )
    )
  );

-- ============================================================
-- STORAGE POLICIES: event-photos-watermarked (PUBLIC)
-- Path structure: {event-id}/watermarked/photo-{uuid}.jpg or {event-id}/thumbnails/photo-{uuid}.jpg
-- ============================================================

-- Select: Public (bucket is already public, but adding explicit policy)
CREATE POLICY "event_photos_watermarked_select_policy" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'event-photos-watermarked');

-- Upload: Admins can upload to any event, organizers only to their events
CREATE POLICY "event_photos_watermarked_upload_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event-photos-watermarked'
    AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
      OR
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id::text = (storage.foldername(name))[1]
        AND events.organizer_id = auth.uid()
      )
    )
  );

-- Update: Same rules as upload
CREATE POLICY "event_photos_watermarked_update_policy" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'event-photos-watermarked'
    AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
      OR
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id::text = (storage.foldername(name))[1]
        AND events.organizer_id = auth.uid()
      )
    )
  );

-- Delete: Same rules as upload
CREATE POLICY "event_photos_watermarked_delete_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'event-photos-watermarked'
    AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
      OR
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id::text = (storage.foldername(name))[1]
        AND events.organizer_id = auth.uid()
      )
    )
  );

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_photo_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for event_photos
CREATE TRIGGER event_photos_updated_at
  BEFORE UPDATE ON event_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_tables_updated_at();

-- Trigger for photo_packages
CREATE TRIGGER photo_packages_updated_at
  BEFORE UPDATE ON photo_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_tables_updated_at();

-- Trigger for photo_orders
CREATE TRIGGER photo_orders_updated_at
  BEFORE UPDATE ON photo_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_tables_updated_at();

-- ============================================================
-- GRANTS
-- ============================================================
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON FUNCTION update_photo_tables_updated_at() IS 'Automatically updates updated_at timestamp for photo-related tables';
