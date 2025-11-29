-- Migration: Fix User Avatars Storage RLS
-- Description: Restricts user-avatars bucket to only allow users to upload to their own path
-- Created: 2025-01-25
-- Issue: Current policy allows any authenticated user to upload to any path in user-avatars bucket

-- ============================================================================
-- STEP 1: Drop existing overly permissive policies for user-avatars
-- ============================================================================

DROP POLICY IF EXISTS "user_avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "user_avatars_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "user_avatars_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "user_avatars_authenticated_delete" ON storage.objects;

-- ============================================================================
-- STEP 2: Create secure policies that bind path to user_id
-- ============================================================================

-- Public read access (avatars should be viewable)
CREATE POLICY "user_avatars_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

-- Users can only upload to their own folder (path must start with their user_id)
-- Expected path format: {user_id}/avatar.{ext} or {user_id}/{filename}
CREATE POLICY "user_avatars_owner_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only update their own files
CREATE POLICY "user_avatars_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only delete their own files
CREATE POLICY "user_avatars_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- STEP 3: Revoke overly broad grants from migration 014
-- ============================================================================

-- Note: We keep USAGE on schema for authenticated users but revoke ALL
-- This allows RLS policies to work while preventing direct object manipulation

REVOKE ALL ON storage.objects FROM authenticated;
REVOKE ALL ON storage.buckets FROM authenticated;

-- Grant only necessary permissions (RLS will control actual access)
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO authenticated;

-- ============================================================================
-- STEP 4: Add similar owner-based policies for other buckets that need them
-- ============================================================================

-- Note: event-banners, event-media, etc. are correctly restricted to admin/organizer
-- Only user-avatars needed owner-based restriction
