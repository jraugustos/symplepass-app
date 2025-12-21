-- Migration: Photo Uploads Temp Bucket
-- Description: Create temporary storage bucket for ZIP files during bulk upload processing
-- Created: 2025-01-XX

-- ============================================================
-- STORAGE BUCKET: photo-uploads-temp
-- Description: Temporary storage for ZIP files during bulk upload processing
-- Files are deleted after processing is complete
-- ============================================================
-- Comment 2: Narrowed allowed_mime_types to ZIP-specific types only (removed application/octet-stream)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photo-uploads-temp',
  'photo-uploads-temp',
  false, -- PRIVATE - only accessible by authenticated users
  5368709120, -- 5GB max file size
  ARRAY['application/zip', 'application/x-zip-compressed']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5368709120,
  allowed_mime_types = ARRAY['application/zip', 'application/x-zip-compressed'];

-- ============================================================
-- STORAGE POLICIES
-- ============================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "photo_uploads_temp_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "photo_uploads_temp_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "photo_uploads_temp_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "photo_uploads_temp_delete_policy" ON storage.objects;

-- SELECT: Users can read their own uploads, admins can read all
CREATE POLICY "photo_uploads_temp_select_policy" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'photo-uploads-temp'
    AND (
      -- Admins can see all
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
      OR
      -- Users can see files in folders they own (folder name is user_id)
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- INSERT: Admins and organizers can upload
CREATE POLICY "photo_uploads_temp_insert_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'photo-uploads-temp'
    AND (
      -- Admins can upload anywhere
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
      OR
      -- Organizers can upload to their own folder
      (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'organizer'
        )
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
    )
  );

-- UPDATE: Admins and organizers can update their own uploads
-- Comment 2: Aligned with INSERT policy to require admin or organizer role
CREATE POLICY "photo_uploads_temp_update_policy" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'photo-uploads-temp'
    AND (
      -- Admins can update anywhere
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
      OR
      -- Organizers can update their own folder
      (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'organizer'
        )
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
    )
  );

-- DELETE: Admins and organizers can delete their own uploads
-- Comment 2: Aligned with INSERT policy to require admin or organizer role
CREATE POLICY "photo_uploads_temp_delete_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'photo-uploads-temp'
    AND (
      -- Admins can delete anywhere
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
      OR
      -- Organizers can delete their own folder
      (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'organizer'
        )
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
    )
  );

-- ============================================================
-- COMMENTS
-- ============================================================
-- Note: Cannot add COMMENT to storage.buckets as it's owned by supabase_admin
