/**
 * Script to setup storage buckets in Supabase
 * Run with: npx tsx scripts/setup-storage-buckets.ts
 */

import { createClient } from '@supabase/supabase-js';
import { STORAGE_BUCKETS } from '../lib/storage/storage-config';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupBuckets() {
  console.log('🚀 Setting up storage buckets...\n');

  for (const [key, config] of Object.entries(STORAGE_BUCKETS)) {
    console.log(`📦 Processing bucket: ${config.name}`);

    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.error(`  ❌ Error listing buckets: ${listError.message}`);
        continue;
      }

      const bucketExists = buckets?.some((b) => b.name === config.name);

      if (bucketExists) {
        console.log(`  ✅ Bucket already exists: ${config.name}`);

        // Update bucket policies if needed
        if (config.public) {
          await updateBucketPolicies(config.name);
        }
      } else {
        // Create new bucket
        const { data, error: createError } = await supabase.storage.createBucket(
          config.name,
          {
            public: config.public,
            fileSizeLimit: config.constraints.maxSize,
            allowedMimeTypes: config.constraints.allowedTypes.length > 0
              ? config.constraints.allowedTypes
              : undefined,
          }
        );

        if (createError) {
          console.error(`  ❌ Error creating bucket: ${createError.message}`);
        } else {
          console.log(`  ✅ Bucket created successfully: ${config.name}`);

          // Set up policies for the new bucket
          if (config.public) {
            await updateBucketPolicies(config.name);
          }
        }
      }
    } catch (error) {
      console.error(`  ❌ Unexpected error: ${error}`);
    }
  }

  console.log('\n✨ Storage bucket setup complete!');
}

async function updateBucketPolicies(bucketName: string) {
  console.log(`  📝 Setting up policies for ${bucketName}...`);

  // Define RLS policies
  const policies = [
    {
      name: `Give public access to ${bucketName}`,
      definition: `bucket_id = '${bucketName}'`,
      check: `bucket_id = '${bucketName}'`,
    },
  ];

  // Note: Supabase doesn't expose policy management through the JS client
  // You'll need to set these up in the Supabase dashboard or via SQL
  console.log(`  ℹ️  Please ensure the following policies are set in Supabase Dashboard:`);
  console.log(`     - Public read access for bucket: ${bucketName}`);
  console.log(`     - Authenticated write access for bucket: ${bucketName}`);
}

// Run the setup
setupBuckets().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});