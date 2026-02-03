-- Migration: Fix Public Access to Completed Events
-- Description: Add 'completed' status to public events policy
-- Created: 2026-02-01
--
-- Problem: Migration 052 removed 'completed' from the public events policy,
-- breaking anonymous access to the mural de fotos which shows completed events.
--
-- Solution: Recreate the policy with all three public statuses.

DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;

CREATE POLICY "Public events are viewable by everyone"
  ON events FOR SELECT TO public
  USING (
    status = 'published'
    OR (status = 'published_no_registration' AND allow_page_access = true)
    OR status = 'completed'
  );

COMMENT ON POLICY "Public events are viewable by everyone" ON events IS
  'Allows public to view events with published, published_no_registration (with page access), or completed status';
