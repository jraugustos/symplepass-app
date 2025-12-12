-- Migration: Fix Event Photos Public Access
-- Description: Allow anonymous users to view event photos and completed events
-- Created: 2025-01-XX

-- ============================================================
-- FIX 1: Update events policy to include 'completed' status
-- The existing policy only allows 'published' but mural-fotos needs 'completed'
-- ============================================================

-- Drop the old policy that only allows 'published'
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON events;

-- Create new policy that includes all public statuses
CREATE POLICY "Public events are viewable by everyone" ON events
  FOR SELECT TO public
  USING (status IN ('published', 'published_no_registration', 'completed'));

-- ============================================================
-- FIX 2: Update event_photos policy for public access
-- ============================================================

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "event_photos_select_policy" ON event_photos;

-- Create new policy that explicitly allows public access to photos of completed/published events
-- The key change is using TO public instead of relying only on authenticated checks
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

-- Separate policy for authenticated users (organizers/admins) to see their own events regardless of status
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
