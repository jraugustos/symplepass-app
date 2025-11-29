# Storage Upload Fix Guide

## Problem Summary

File uploads to Supabase Storage are failing at 50% with the error:
```
new row violates row-level security policy
```

This occurs because the storage buckets exist but don't have the correct Row Level Security (RLS) policies configured.

---

## Root Cause

The storage buckets were created, but the RLS policies that allow authenticated users to upload files were either:
1. Not created at all
2. Created with incorrect syntax
3. Not applied to the `storage.objects` table

---

## Quick Fix (Recommended)

### Option 1: Run SQL Script in Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `symplepass`

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy & Paste the Fix Script**
   - Open file: `scripts/fix-storage-policies-now.sql`
   - Copy the entire contents
   - Paste into the SQL Editor

4. **Run the Script**
   - Click "Run" or press `Cmd/Ctrl + Enter`
   - Wait for completion (should take a few seconds)
   - You should see a success message

5. **Verify Policies Were Created**
   - The script will output a table showing all created policies
   - You should see policies like:
     - `event_banners_public_read`
     - `event_banners_authenticated_upload`
     - etc.

6. **Test Upload**
   - Go back to your application
   - Try uploading an image again
   - It should now work!

---

### Option 2: Run Migration (For Development)

If you're using local development or have migration tools set up:

```bash
cd symplepass-app

# Make sure you're on the latest migration
supabase migration up

# Or manually run the migration
supabase db execute -f supabase/migrations/014_fix_storage_policies.sql
```

---

## Verify the Fix

### Method 1: Run the Diagnostic Script

```bash
cd symplepass-app
npx tsx scripts/check-auth-and-storage.ts
```

This will check:
- ✅ Environment variables
- ✅ User authentication
- ✅ User role permissions
- ✅ Storage bucket configuration
- ✅ RLS policies
- ✅ Upload permissions

### Method 2: Use the Diagnostic Component

1. **Add the diagnostic page to your app**
   ```bash
   # Create a test page
   mkdir -p app/test-storage
   ```

2. **Create the page component**
   ```tsx
   // app/test-storage/page.tsx
   import { StorageDiagnostic } from '@/components/storage-diagnostic'

   export default function TestStoragePage() {
     return <StorageDiagnostic />
   }
   ```

3. **Navigate to the page**
   - Visit: http://localhost:3000/test-storage
   - Click "Run Diagnostics"
   - Review the results

### Method 3: Check in Supabase Dashboard

1. **Go to Storage**
   - Dashboard → Storage → event-banners

2. **Check Policies**
   - Click on "Policies" tab
   - You should see 4 policies:
     - `event_banners_public_read`
     - `event_banners_authenticated_upload`
     - `event_banners_authenticated_update`
     - `event_banners_authenticated_delete`

3. **Test Upload Manually**
   - Click "Upload file"
   - Select an image
   - It should upload successfully

---

## User Role Requirements

For uploads to work, users MUST have the correct role in the `profiles` table.

### Check User Role

Run this in Supabase SQL Editor:
```sql
SELECT id, email, full_name, role
FROM profiles
WHERE email = 'your-email@example.com';
```

### Update User Role

If the role is wrong, update it:
```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

**Valid roles for uploads:**
- `admin` - Full access to all features
- `organizer` - Can create events and upload event assets
- `user` - Cannot upload event assets (only user avatars)

---

## Troubleshooting

### Issue: "Bucket not found"

**Solution:**
1. Run the bucket setup script:
   ```bash
   npx tsx scripts/setup-storage-buckets.ts
   ```

2. Or create bucket manually in Supabase Dashboard:
   - Storage → New Bucket
   - Name: `event-banners`
   - Public: ✅ Yes
   - File size limit: 10 MB
   - Allowed MIME types: `image/jpeg, image/png, image/webp, image/gif, image/svg+xml`

### Issue: "User not authenticated"

**Solution:**
1. Make sure you're logged in to the application
2. Check that the session is valid:
   ```javascript
   // In browser console
   const { data: { session } } = await supabase.auth.getSession()
   console.log(session)
   ```

### Issue: "Still getting RLS error after running fix"

**Possible causes:**
1. **Migration didn't run completely**
   - Check Supabase Dashboard logs for errors
   - Try running the SQL script manually (Option 1)

2. **User role is incorrect**
   - Verify role is `admin` or `organizer`
   - See "User Role Requirements" section above

3. **Policies are conflicting**
   - Drop all storage policies and re-run the fix:
   ```sql
   -- In Supabase SQL Editor
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
   ```
   - Then run `fix-storage-policies-now.sql` again

4. **Cache issue**
   - Clear browser cache and cookies
   - Hard refresh (Cmd/Ctrl + Shift + R)
   - Try in incognito/private window

### Issue: "Upload succeeds but URL doesn't work"

**Solution:**
1. Check if bucket is public:
   ```sql
   SELECT id, name, public FROM storage.buckets;
   ```

2. Make bucket public:
   ```sql
   UPDATE storage.buckets
   SET public = true
   WHERE name = 'event-banners';
   ```

---

## File Structure

### Scripts
- `scripts/fix-storage-policies-now.sql` - **Emergency fix for RLS policies**
- `scripts/check-auth-and-storage.ts` - Comprehensive diagnostic tool
- `scripts/check-storage.ts` - Basic storage check
- `scripts/setup-storage-buckets.ts` - Create storage buckets

### Migrations
- `supabase/migrations/008_event_banners_storage.sql` - Original (broken) migration
- `supabase/migrations/014_fix_storage_policies.sql` - Fixed migration

### Components
- `components/storage-diagnostic.tsx` - Interactive diagnostic UI
- `components/ui/file-upload.tsx` - File upload component
- `lib/storage/upload-service.ts` - Upload service

---

## Technical Details

### What the Fix Does

1. **Drops existing policies** - Removes any broken or conflicting policies
2. **Creates buckets** - Ensures all storage buckets exist with correct config
3. **Creates RLS policies** - Adds policies for:
   - Public read access (anyone can view files)
   - Authenticated upload (only admin/organizer can upload)
   - Authenticated update (only admin/organizer can modify)
   - Authenticated delete (only admin/organizer can delete)

### Why the Original Migration Failed

The original migration in `008_event_banners_storage.sql` had issues:
1. Policy names with special characters (Portuguese accents)
2. Complex subqueries that might not execute correctly
3. Missing explicit schema references (`public.profiles`)
4. No error handling for existing policies

### How the Fix is Different

1. **Simple policy names** - Uses English names without special characters
2. **Explicit schema references** - Uses `public.profiles` instead of just `profiles`
3. **Idempotent** - Can be run multiple times safely
4. **Comprehensive** - Fixes all buckets, not just event-banners
5. **Verified syntax** - Uses proven RLS policy patterns

---

## Next Steps After Fix

1. ✅ **Verify uploads work**
   - Try uploading an event banner
   - Try uploading kit items
   - Try uploading user avatar

2. ✅ **Update other users' roles**
   - Identify organizers who need upload access
   - Update their roles in the profiles table

3. ✅ **Monitor for errors**
   - Check browser console during uploads
   - Check Supabase Dashboard logs
   - Set up error tracking (Sentry, etc.)

4. ✅ **Document for team**
   - Share this guide with team members
   - Add to project documentation
   - Create runbook for future issues

---

## Prevention

To prevent this issue in the future:

1. **Test migrations before deploying**
   ```bash
   supabase db reset
   supabase migration up
   ```

2. **Always verify storage policies after creating buckets**
   ```bash
   npx tsx scripts/check-auth-and-storage.ts
   ```

3. **Use the diagnostic tool regularly**
   - Add to CI/CD pipeline
   - Run before major releases
   - Include in deployment checklist

4. **Keep migration files clean**
   - Avoid special characters in policy names
   - Use explicit schema references
   - Add comments explaining complex logic
   - Test on a staging database first

---

## Support

If you're still having issues after following this guide:

1. **Check the logs**
   - Browser console (F12 → Console)
   - Supabase Dashboard → Logs
   - Network tab (F12 → Network)

2. **Run diagnostics**
   - `npx tsx scripts/check-auth-and-storage.ts`
   - Visit `/test-storage` in your app

3. **Share diagnostic output**
   - Copy the full output from diagnostic script
   - Include error messages from browser console
   - Note which step failed

4. **Check Supabase status**
   - Visit: https://status.supabase.com/
   - Verify no ongoing incidents

---

## Summary Checklist

- [ ] Run `scripts/fix-storage-policies-now.sql` in Supabase SQL Editor
- [ ] Verify policies were created (check output)
- [ ] Confirm user has `admin` or `organizer` role
- [ ] Test upload in application
- [ ] Run diagnostic script to verify
- [ ] Clear browser cache if needed
- [ ] Update other users' roles as needed
- [ ] Document resolution for team

---

**Last Updated:** 2025-01-21
**Status:** Tested and verified
**Applies to:** Symplepass v1.0+
