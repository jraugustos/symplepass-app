/**
 * Comprehensive diagnostic script for authentication and storage
 * Run with: npx tsx scripts/check-auth-and-storage.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

async function checkConfiguration() {
  console.log('🔍 Comprehensive Storage & Auth Diagnostic\n')
  console.log('=' .repeat(80))

  // ============================================================================
  // 1. Check Environment
  // ============================================================================
  console.log('\n📋 STEP 1: Environment Variables')
  console.log('-'.repeat(80))
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '⚠️  Missing (optional)')

  // ============================================================================
  // 2. Check User Authentication
  // ============================================================================
  console.log('\n👤 STEP 2: User Authentication')
  console.log('-'.repeat(80))

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.log('❌ No authenticated user')
    console.log('   This script needs to run in the browser context where a user is logged in')
    console.log('   OR you need to provide a user access token')
    console.log('\n💡 To test with a real user:')
    console.log('   1. Log in to your app in the browser')
    console.log('   2. Open DevTools Console')
    console.log('   3. Run: localStorage.getItem("supabase.auth.token")')
    console.log('   4. Copy the access_token from the JSON')
    console.log('   5. Set it as an environment variable')
  } else {
    console.log('✅ User authenticated')
    console.log('   Email:', user.email)
    console.log('   ID:', user.id)

    // Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.log('   ❌ Error fetching profile:', profileError.message)
    } else if (!profile) {
      console.log('   ❌ No profile found for user')
    } else {
      console.log('   ✅ Profile found')
      console.log('      Full Name:', profile.full_name)
      console.log('      Role:', profile.role)
      console.log('      CPF:', profile.cpf ? '✅ Set' : '❌ Missing')

      if (profile.role !== 'admin' && profile.role !== 'organizer') {
        console.log('\n   ⚠️  WARNING: User role is "' + profile.role + '"')
        console.log('      Only users with "admin" or "organizer" roles can upload event banners')
        console.log('      You need to update the role in the database')
      }
    }
  }

  // ============================================================================
  // 3. Check Storage Buckets (with admin client if available)
  // ============================================================================
  console.log('\n📦 STEP 3: Storage Buckets')
  console.log('-'.repeat(80))

  if (supabaseAdmin) {
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()

    if (bucketsError) {
      console.log('❌ Error listing buckets:', bucketsError.message)
    } else {
      console.log('✅ Buckets found:', buckets?.length || 0)

      const expectedBuckets = [
        'event-banners',
        'event-media',
        'event-documents',
        'event-routes',
        'kit-items',
        'user-avatars',
        'organizer-assets'
      ]

      expectedBuckets.forEach(expectedBucket => {
        const bucket = buckets?.find(b => b.name === expectedBucket)
        if (bucket) {
          console.log(`   ✅ ${expectedBucket} - ${bucket.public ? 'Public' : 'Private'}`)
        } else {
          console.log(`   ❌ ${expectedBucket} - Not found`)
        }
      })
    }
  } else {
    console.log('⚠️  Skipping bucket enumeration (requires SERVICE_ROLE_KEY)')
  }

  // ============================================================================
  // 4. Test Storage Policies
  // ============================================================================
  console.log('\n🔐 STEP 4: Storage Policy Tests')
  console.log('-'.repeat(80))

  // Test public read
  console.log('\n   Testing public read access...')
  const { data: publicFiles, error: publicReadError } = await supabase.storage
    .from('event-banners')
    .list()

  if (publicReadError) {
    console.log('   ❌ Public read failed:', publicReadError.message)
  } else {
    console.log('   ✅ Public read OK (', publicFiles?.length || 0, 'files)')
  }

  // Test authenticated upload
  if (user) {
    console.log('\n   Testing authenticated upload...')
    const testFileName = `test-upload-${Date.now()}.txt`
    const testFile = new Blob(['test content'], { type: 'text/plain' })

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('event-banners')
      .upload(testFileName, testFile)

    if (uploadError) {
      console.log('   ❌ Upload failed:', uploadError.message)

      if (uploadError.message.includes('row-level security')) {
        console.log('\n   🔧 RLS POLICY ISSUE DETECTED:')
        console.log('      The storage policies are blocking your upload')
        console.log('      Run the fix script: scripts/fix-storage-policies-now.sql')
        console.log('      In Supabase Dashboard: SQL Editor > New Query > Paste & Run')
      }
    } else {
      console.log('   ✅ Upload successful!')
      console.log('      Path:', uploadData?.path)

      // Clean up test file
      console.log('\n   Cleaning up test file...')
      const { error: deleteError } = await supabase.storage
        .from('event-banners')
        .remove([testFileName])

      if (deleteError) {
        console.log('   ⚠️  Could not delete test file:', deleteError.message)
      } else {
        console.log('   ✅ Test file removed')
      }
    }
  } else {
    console.log('\n   ⏭️  Skipping upload test (no authenticated user)')
  }

  // ============================================================================
  // 5. Check Storage Policies (with admin client)
  // ============================================================================
  if (supabaseAdmin) {
    console.log('\n📜 STEP 5: Storage Policies in Database')
    console.log('-'.repeat(80))

    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('policyname, tablename')
      .eq('schemaname', 'storage')
      .eq('tablename', 'objects')

    if (policiesError) {
      console.log('❌ Error fetching policies:', policiesError.message)
    } else if (!policies || policies.length === 0) {
      console.log('⚠️  NO POLICIES FOUND!')
      console.log('   This is the root cause - storage.objects has no RLS policies')
      console.log('   You MUST run: scripts/fix-storage-policies-now.sql')
    } else {
      console.log('✅ Found', policies.length, 'storage policies:')
      policies.forEach(p => {
        console.log('   -', p.policyname)
      })
    }
  }

  // ============================================================================
  // 6. Summary & Recommendations
  // ============================================================================
  console.log('\n' + '='.repeat(80))
  console.log('📊 SUMMARY & RECOMMENDATIONS')
  console.log('='.repeat(80))

  if (!user) {
    console.log('\n❌ CRITICAL: No authenticated user')
    console.log('   → This diagnostic should be run from a logged-in browser context')
    console.log('   → Or provide an access token via environment variable')
  } else {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'organizer')) {
      console.log('\n❌ CRITICAL: User does not have correct role')
      console.log('   → Current role:', profile?.role || 'unknown')
      console.log('   → Required role: admin or organizer')
      console.log('   → Fix with SQL:')
      console.log('     UPDATE profiles SET role = \'admin\' WHERE id = \'' + user.id + '\';')
    }
  }

  console.log('\n🔧 NEXT STEPS:')
  console.log('   1. Run the fix script in Supabase SQL Editor:')
  console.log('      scripts/fix-storage-policies-now.sql')
  console.log('   2. Ensure your user has admin or organizer role')
  console.log('   3. Try uploading again in the application')
  console.log('   4. Check browser console for detailed error messages')

  console.log('\n✨ Diagnostic complete!\n')
}

checkConfiguration().catch(console.error)
