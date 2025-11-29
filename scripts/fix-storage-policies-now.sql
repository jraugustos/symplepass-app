-- ============================================================================
-- EMERGENCY FIX: Storage Policies for File Uploads
-- ============================================================================
-- Run this directly in the Supabase SQL Editor to fix upload issues immediately
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ============================================================================

-- Step 1: Drop ALL existing storage policies to start fresh
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Step 2: Ensure buckets exist with correct configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('event-banners', 'event-banners', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('event-media', 'event-media', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('event-documents', 'event-documents', true, 52428800, ARRAY['application/pdf']),
  ('event-routes', 'event-routes', true, 20971520, ARRAY['application/gpx+xml', 'application/xml', 'text/xml']),
  ('kit-items', 'kit-items', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('user-avatars', 'user-avatars', true, 2097152, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('organizer-assets', 'organizer-assets', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Step 3: Create simple, working policies

-- ============================================================================
-- EVENT BANNERS - For event banner images
-- ============================================================================

-- Public read
CREATE POLICY "event_banners_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-banners');

-- Authenticated users with admin/organizer role can upload
CREATE POLICY "event_banners_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-banners'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'organizer')
  )
);

-- Authenticated users with admin/organizer role can update
CREATE POLICY "event_banners_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-banners'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'organizer')
  )
);

-- Authenticated users with admin/organizer role can delete
CREATE POLICY "event_banners_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-banners'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'organizer')
  )
);

-- ============================================================================
-- EVENT MEDIA - For additional event images
-- ============================================================================

CREATE POLICY "event_media_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-media');

CREATE POLICY "event_media_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-media'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'organizer')
  )
);

-- ============================================================================
-- EVENT DOCUMENTS - For PDFs and documents
-- ============================================================================

CREATE POLICY "event_documents_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-documents');

CREATE POLICY "event_documents_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-documents'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'organizer')
  )
);

-- ============================================================================
-- EVENT ROUTES - For GPX files
-- ============================================================================

CREATE POLICY "event_routes_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-routes');

CREATE POLICY "event_routes_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-routes'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'organizer')
  )
);

-- ============================================================================
-- KIT ITEMS - For athlete kit images
-- ============================================================================

CREATE POLICY "kit_items_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'kit-items');

CREATE POLICY "kit_items_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kit-items'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'organizer')
  )
);

-- ============================================================================
-- USER AVATARS - Any authenticated user can upload
-- ============================================================================

CREATE POLICY "user_avatars_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

CREATE POLICY "user_avatars_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-avatars');

-- ============================================================================
-- ORGANIZER ASSETS - For organizer logos and assets
-- ============================================================================

CREATE POLICY "organizer_assets_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organizer-assets');

CREATE POLICY "organizer_assets_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organizer-assets'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'organizer')
  )
);

-- Step 4: Verify policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
ORDER BY policyname;
