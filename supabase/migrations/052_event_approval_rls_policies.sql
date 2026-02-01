-- ============================================================
-- Migration: 052_event_approval_rls_policies.sql
-- Description: Enhances RLS policies to properly handle pending_approval events
-- This ensures:
--   1. Public can view published and published_no_registration events
--   2. Organizers can view their own events regardless of status
--   3. Admins can view all events regardless of status
--   4. pending_approval events are ONLY visible to owner and admins
-- ============================================================

-- Drop old policies (both possible names)
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;

-- Create a new policy that covers both published statuses
-- This ensures events with status 'published' OR 'published_no_registration' are visible
-- Note: We also check allow_page_access for published_no_registration events
CREATE POLICY "Public events are viewable by everyone"
  ON events FOR SELECT
  USING (
    status = 'published' 
    OR (status = 'published_no_registration' AND allow_page_access = true)
  );

-- The existing policy "Organizers and admins can view their own events" already covers
-- organizers viewing their own events regardless of status, so no changes needed there.

-- Add a policy specifically for admins to view ALL pending approval events
-- This is useful for the approval workflow page
DROP POLICY IF EXISTS "Admins can view all pending approval events" ON events;
CREATE POLICY "Admins can view all pending approval events"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    AND status = 'pending_approval'
  );

-- Add comments for documentation
COMMENT ON POLICY "Public events are viewable by everyone" ON events IS 
  'Allows public to view events with published status, or published_no_registration with page access enabled';

COMMENT ON POLICY "Admins can view all pending approval events" ON events IS 
  'Allows admins to view all events pending approval for the approval workflow';
