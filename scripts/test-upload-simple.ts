/**
 * Simple upload test - creates a minimal test file and tries to upload it
 * This helps verify that storage policies are working
 *
 * Run with: npx tsx scripts/test-upload-simple.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testUpload() {
  console.log('🧪 Simple Upload Test\n')
  console.log('=' .repeat(60))

  // Step 1: Check auth
  console.log('\n1️⃣ Checking authentication...')
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    console.log('❌ Not authenticated')
    console.log('   This script needs to be run in a context where a user is logged in')
    console.log('\n💡 To test:')
    console.log('   1. Use the StorageDiagnostic component in your app')
    console.log('   2. Or set up authentication in this script')
    return
  }

  console.log('✅ Authenticated as:', user.email)

  // Step 2: Check role
  console.log('\n2️⃣ Checking user role...')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    console.log('❌ No profile found')
    return
  }

  console.log('   Role:', profile.role)

  if (profile.role !== 'admin' && profile.role !== 'organizer') {
    console.log('❌ User does not have upload permission')
    console.log('   Current role:', profile.role)
    console.log('   Required: admin or organizer')
    console.log('\n💡 Fix with SQL:')
    console.log(`   UPDATE profiles SET role = 'admin' WHERE id = '${user.id}';`)
    return
  }

  console.log('✅ Has upload permission')

  // Step 3: Create test file
  console.log('\n3️⃣ Creating test file...')
  const testContent = 'Test upload from scripts/test-upload-simple.ts'
  const testFile = new Blob([testContent], { type: 'text/plain' })
  const fileName = `test-${Date.now()}.txt`
  console.log('   File name:', fileName)
  console.log('   File size:', testFile.size, 'bytes')

  // Step 4: Upload to event-banners bucket
  console.log('\n4️⃣ Uploading to event-banners bucket...')
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('event-banners')
    .upload(fileName, testFile, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    console.log('❌ Upload failed!')
    console.log('   Error:', uploadError.message)

    if (uploadError.message.includes('row-level security')) {
      console.log('\n🔧 RLS POLICY ERROR DETECTED!')
      console.log('   The storage policies are not configured correctly.')
      console.log('\n   To fix:')
      console.log('   1. Open Supabase Dashboard SQL Editor')
      console.log('   2. Run the script: scripts/fix-storage-policies-now.sql')
      console.log('   3. Try this test again')
    }

    return
  }

  console.log('✅ Upload successful!')
  console.log('   Path:', uploadData.path)

  // Step 5: Get public URL
  console.log('\n5️⃣ Getting public URL...')
  const { data: urlData } = supabase.storage
    .from('event-banners')
    .getPublicUrl(uploadData.path)

  console.log('✅ Public URL generated')
  console.log('   URL:', urlData.publicUrl)

  // Step 6: Verify file exists
  console.log('\n6️⃣ Verifying file exists...')
  const { data: files, error: listError } = await supabase.storage
    .from('event-banners')
    .list('', {
      limit: 100,
      search: fileName
    })

  if (listError || !files || files.length === 0) {
    console.log('⚠️  Could not verify file (but upload succeeded)')
  } else {
    console.log('✅ File verified in bucket')
    console.log('   Found:', files[0].name)
  }

  // Step 7: Clean up - delete test file
  console.log('\n7️⃣ Cleaning up test file...')
  const { error: deleteError } = await supabase.storage
    .from('event-banners')
    .remove([fileName])

  if (deleteError) {
    console.log('⚠️  Could not delete test file:', deleteError.message)
    console.log('   You may need to delete it manually from Supabase Dashboard')
  } else {
    console.log('✅ Test file deleted')
  }

  // Success!
  console.log('\n' + '='.repeat(60))
  console.log('🎉 ALL TESTS PASSED!')
  console.log('='.repeat(60))
  console.log('\n✅ Storage upload is working correctly')
  console.log('✅ User has proper permissions')
  console.log('✅ Policies are configured correctly')
  console.log('\nYou can now upload files in your application! 🚀\n')
}

testUpload().catch(error => {
  console.error('\n💥 Unexpected error:', error)
  process.exit(1)
})
