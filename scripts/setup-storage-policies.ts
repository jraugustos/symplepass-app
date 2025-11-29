/**
 * Script to set up storage RLS policies via Supabase Management API
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/setup-storage-policies.ts
 */

const SUPABASE_URL = 'https://syatndomjabuvrkjhddl.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

// Policy definitions for event-related buckets
const eventBucketPolicy = (bucketId: string) => `
(
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.organizer_id = auth.uid()
    AND (
      events.id::text = (storage.foldername(name))[1]
      OR events.slug = (storage.foldername(name))[1]
    )
  )
)
`

// Policy for organizer-assets bucket
const organizerAssetsPolicy = `
(
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
  OR
  (
    (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'organizer'
    )
  )
)
`

interface PolicyConfig {
  name: string
  bucket_id: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT'
  definition: string
  check?: string
}

const policies: PolicyConfig[] = [
  // event-banners
  { name: 'event_banners_owner_upload', bucket_id: 'event-banners', operation: 'INSERT', definition: '', check: eventBucketPolicy('event-banners') },
  { name: 'event_banners_owner_update', bucket_id: 'event-banners', operation: 'UPDATE', definition: eventBucketPolicy('event-banners'), check: eventBucketPolicy('event-banners') },
  { name: 'event_banners_owner_delete', bucket_id: 'event-banners', operation: 'DELETE', definition: eventBucketPolicy('event-banners') },

  // event-media
  { name: 'event_media_owner_upload', bucket_id: 'event-media', operation: 'INSERT', definition: '', check: eventBucketPolicy('event-media') },
  { name: 'event_media_owner_update', bucket_id: 'event-media', operation: 'UPDATE', definition: eventBucketPolicy('event-media'), check: "bucket_id = 'event-media'" },
  { name: 'event_media_owner_delete', bucket_id: 'event-media', operation: 'DELETE', definition: eventBucketPolicy('event-media') },

  // event-documents
  { name: 'event_documents_owner_upload', bucket_id: 'event-documents', operation: 'INSERT', definition: '', check: eventBucketPolicy('event-documents') },
  { name: 'event_documents_owner_delete', bucket_id: 'event-documents', operation: 'DELETE', definition: eventBucketPolicy('event-documents') },

  // event-routes
  { name: 'event_routes_owner_upload', bucket_id: 'event-routes', operation: 'INSERT', definition: '', check: eventBucketPolicy('event-routes') },
  { name: 'event_routes_owner_delete', bucket_id: 'event-routes', operation: 'DELETE', definition: eventBucketPolicy('event-routes') },

  // kit-items
  { name: 'kit_items_owner_upload', bucket_id: 'kit-items', operation: 'INSERT', definition: '', check: eventBucketPolicy('kit-items') },
  { name: 'kit_items_owner_delete', bucket_id: 'kit-items', operation: 'DELETE', definition: eventBucketPolicy('kit-items') },

  // organizer-assets
  { name: 'organizer_assets_owner_upload', bucket_id: 'organizer-assets', operation: 'INSERT', definition: '', check: organizerAssetsPolicy },
  { name: 'organizer_assets_owner_delete', bucket_id: 'organizer-assets', operation: 'DELETE', definition: organizerAssetsPolicy },
]

// Policies to drop first
const policiesToDrop = [
  'event_banners_authenticated_upload',
  'event_banners_authenticated_update',
  'event_banners_authenticated_delete',
  'event_media_authenticated_upload',
  'event_documents_authenticated_upload',
  'event_routes_authenticated_upload',
  'kit_items_authenticated_upload',
  'organizer_assets_authenticated_upload',
]

async function executeSQL(sql: string): Promise<{ error?: string }> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  })

  if (!response.ok) {
    // Try direct SQL via PostgREST won't work, use pg connection
    return { error: `HTTP ${response.status}` }
  }

  return {}
}

async function runDirectSQL(sql: string): Promise<void> {
  // Using the Supabase SQL endpoint
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: sql,
  })

  console.log('Response status:', response.status)
}

async function main() {
  console.log('🚀 Setting up storage policies...\n')

  // Generate SQL statements
  let dropStatements = policiesToDrop.map(name =>
    `DROP POLICY IF EXISTS "${name}" ON storage.objects;`
  ).join('\n')

  let createStatements = policies.map(p => {
    if (p.operation === 'INSERT') {
      return `
CREATE POLICY "${p.name}"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = '${p.bucket_id}'
  AND ${p.check}
);`
    } else if (p.operation === 'DELETE') {
      return `
CREATE POLICY "${p.name}"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = '${p.bucket_id}'
  AND ${p.definition}
);`
    } else if (p.operation === 'UPDATE') {
      return `
CREATE POLICY "${p.name}"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = '${p.bucket_id}'
  AND ${p.definition}
)
WITH CHECK (
  bucket_id = '${p.bucket_id}'
  AND ${p.check}
);`
    }
    return ''
  }).join('\n')

  const fullSQL = `
-- Drop existing permissive policies
${dropStatements}

-- Create new ownership-based policies
${createStatements}
`

  console.log('Generated SQL:\n')
  console.log(fullSQL)
  console.log('\n📋 Copy this SQL and run it in the Supabase SQL Editor with appropriate permissions.')
  console.log('\nAlternatively, run via psql:')
  console.log(`PGPASSWORD="$SUPABASE_SERVICE_ROLE_KEY" psql -h db.syatndomjabuvrkjhddl.supabase.co -U postgres -d postgres -c "..."`)
}

main().catch(console.error)
