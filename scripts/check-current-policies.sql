-- ============================================================================
-- Script to check current storage policies and configuration
-- ============================================================================
-- Run this in Supabase SQL Editor to see what policies are currently set
-- This helps diagnose why uploads are failing
-- ============================================================================

-- Check 1: List all storage buckets
SELECT
  '=== STORAGE BUCKETS ===' as info,
  '' as detail;

SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
ORDER BY name;

-- Check 2: List all storage policies
SELECT
  '' as spacer,
  '=== STORAGE POLICIES ===' as info,
  '' as detail;

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_condition,
  with_check as check_condition
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
ORDER BY policyname;

-- Check 3: Count policies by bucket
SELECT
  '' as spacer,
  '=== POLICIES BY BUCKET ===' as info,
  '' as detail;

SELECT
  CASE
    WHEN policyname LIKE '%event_banners%' THEN 'event-banners'
    WHEN policyname LIKE '%event_media%' THEN 'event-media'
    WHEN policyname LIKE '%event_documents%' THEN 'event-documents'
    WHEN policyname LIKE '%event_routes%' THEN 'event-routes'
    WHEN policyname LIKE '%kit_items%' THEN 'kit-items'
    WHEN policyname LIKE '%user_avatars%' THEN 'user-avatars'
    WHEN policyname LIKE '%organizer_assets%' THEN 'organizer-assets'
    ELSE 'other'
  END as bucket,
  COUNT(*) as policy_count,
  array_agg(policyname) as policies
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
GROUP BY bucket
ORDER BY bucket;

-- Check 4: Test if current user has a profile with correct role
SELECT
  '' as spacer,
  '=== CURRENT USER ===' as info,
  '' as detail;

SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  CASE
    WHEN p.role IN ('admin', 'organizer') THEN '✅ Can upload'
    ELSE '❌ Cannot upload (need admin or organizer)'
  END as upload_permission
FROM profiles p
WHERE p.id = auth.uid();

-- Check 5: Count users by role
SELECT
  '' as spacer,
  '=== USERS BY ROLE ===' as info,
  '' as detail;

SELECT
  role,
  COUNT(*) as user_count
FROM profiles
GROUP BY role
ORDER BY role;

-- Check 6: Show detailed policy definitions for event-banners
SELECT
  '' as spacer,
  '=== EVENT-BANNERS POLICIES (DETAILED) ===' as info,
  '' as detail;

SELECT
  policyname,
  cmd as operation,
  roles as for_role,
  CASE
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    ELSE '(no USING clause)'
  END as using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE '(no WITH CHECK clause)'
  END as check_clause
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND (
  policyname LIKE '%banner%'
  OR policyname LIKE '%event_banner%'
  OR policyname LIKE '%Admins%'
)
ORDER BY cmd, policyname;

-- Check 7: Verify RLS is enabled on storage.objects
SELECT
  '' as spacer,
  '=== RLS STATUS ===' as info,
  '' as detail;

SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'storage'
AND tablename = 'objects';

-- Check 8: Show all tables in storage schema
SELECT
  '' as spacer,
  '=== STORAGE SCHEMA TABLES ===' as info,
  '' as detail;

SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'storage'
ORDER BY tablename;

-- Summary and recommendations
SELECT
  '' as spacer,
  '=== SUMMARY ===' as info,
  '' as detail;

SELECT
  'Total storage buckets' as metric,
  COUNT(*)::text as value
FROM storage.buckets
UNION ALL
SELECT
  'Total storage policies',
  COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
UNION ALL
SELECT
  'Policies for event-banners',
  COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%banner%'
UNION ALL
SELECT
  'Total users',
  COUNT(*)::text
FROM profiles
UNION ALL
SELECT
  'Admin users',
  COUNT(*)::text
FROM profiles
WHERE role = 'admin'
UNION ALL
SELECT
  'Organizer users',
  COUNT(*)::text
FROM profiles
WHERE role = 'organizer'
UNION ALL
SELECT
  'Regular users',
  COUNT(*)::text
FROM profiles
WHERE role = 'user';

-- Expected results:
-- - Should see 7 storage buckets
-- - Should see at least 4 policies per bucket (read, insert, update, delete)
-- - Current user should have admin or organizer role
-- - RLS should be enabled on storage.objects
