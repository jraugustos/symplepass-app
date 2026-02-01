-- Migration: Fix Public Photo Access
-- Description: Allow anonymous users to view event photos, packages, and pricing tiers
-- Created: 2026-02-01
--
-- Problem: The existing RLS policies use auth.uid() even in the public access clauses,
-- which causes failures when no user is authenticated. Users need to be logged in to
-- view photos in the mural, but photos should be publicly visible.
--
-- Solution: Split policies into two separate ones:
-- 1. TO public - allows anonymous access to photos/packages/pricing of published/completed events
-- 2. TO authenticated - allows organizers/admins to access their own event data

-- ============================================================
-- FIX: event_photos policies
-- ============================================================

-- The migration 043 already created event_photos_select_public and event_photos_select_owner
-- but we need to ensure the old policy is dropped if it still exists
DROP POLICY IF EXISTS "event_photos_select_policy" ON event_photos;

-- Ensure the public policy exists (in case migration 043 wasn't applied)
DROP POLICY IF EXISTS "event_photos_select_public" ON event_photos;
CREATE POLICY "event_photos_select_public" ON event_photos
  FOR SELECT TO public
  USING (
    -- Anyone (including anonymous) can see photos of published/completed events
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_photos.event_id
      AND events.status IN ('published', 'published_no_registration', 'completed')
    )
  );

-- Ensure the authenticated owner policy exists
DROP POLICY IF EXISTS "event_photos_select_owner" ON event_photos;
CREATE POLICY "event_photos_select_owner" ON event_photos
  FOR SELECT TO authenticated
  USING (
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

-- ============================================================
-- FIX: photo_packages policies
-- ============================================================

DROP POLICY IF EXISTS "photo_packages_select_policy" ON photo_packages;

-- Public access to packages of published/completed events
CREATE POLICY "photo_packages_select_public" ON photo_packages
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = photo_packages.event_id
      AND events.status IN ('published', 'published_no_registration', 'completed')
    )
  );

-- Authenticated access for organizers/admins
CREATE POLICY "photo_packages_select_owner" ON photo_packages
  FOR SELECT TO authenticated
  USING (
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
-- FIX: photo_pricing_tiers policies
-- ============================================================

DROP POLICY IF EXISTS "photo_pricing_tiers_select_policy" ON photo_pricing_tiers;

-- Public access to pricing tiers of published/completed events
CREATE POLICY "photo_pricing_tiers_select_public" ON photo_pricing_tiers
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = photo_pricing_tiers.event_id
      AND events.status IN ('published', 'published_no_registration', 'completed')
    )
  );

-- Authenticated access for organizers/admins
CREATE POLICY "photo_pricing_tiers_select_owner" ON photo_pricing_tiers
  FOR SELECT TO authenticated
  USING (
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
-- COMMENTS
-- ============================================================

COMMENT ON POLICY "event_photos_select_public" ON event_photos IS
  'Allows anonymous users to read photos of published/completed events';

COMMENT ON POLICY "event_photos_select_owner" ON event_photos IS
  'Allows authenticated organizers and admins to read their event photos';

COMMENT ON POLICY "photo_packages_select_public" ON photo_packages IS
  'Allows anonymous users to read photo packages of published/completed events';

COMMENT ON POLICY "photo_packages_select_owner" ON photo_packages IS
  'Allows authenticated organizers and admins to read their event packages';

COMMENT ON POLICY "photo_pricing_tiers_select_public" ON photo_pricing_tiers IS
  'Allows anonymous users to read pricing tiers of published/completed events';

COMMENT ON POLICY "photo_pricing_tiers_select_owner" ON photo_pricing_tiers IS
  'Allows authenticated organizers and admins to read their event pricing tiers';
