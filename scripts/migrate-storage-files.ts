/**
 * Script to migrate existing files from old bucket structure to new buckets
 * Run with: npx tsx scripts/migrate-storage-files.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface MigrationMapping {
  sourceBucket: string;
  targetBucket: string;
  filePattern?: RegExp;
  targetFolder?: string;
}

// Define migration mappings
const migrations: MigrationMapping[] = [
  {
    sourceBucket: 'event-banners',
    targetBucket: 'event-media',
    targetFolder: 'banners',
  },
];

async function migrateFiles() {
  console.log('🚀 Starting file migration...\n');

  for (const migration of migrations) {
    console.log(`📦 Processing migration: ${migration.sourceBucket} → ${migration.targetBucket}`);

    try {
      // List files in source bucket
      const { data: files, error: listError } = await supabase.storage
        .from(migration.sourceBucket)
        .list('', {
          limit: 1000,
        });

      if (listError) {
        console.error(`  ❌ Error listing files: ${listError.message}`);
        continue;
      }

      if (!files || files.length === 0) {
        console.log(`  ℹ️  No files found in ${migration.sourceBucket}`);
        continue;
      }

      console.log(`  📁 Found ${files.length} files to migrate`);

      // Migrate each file
      for (const file of files) {
        if (!file.name) continue;

        // Check if file matches pattern (if specified)
        if (migration.filePattern && !migration.filePattern.test(file.name)) {
          console.log(`  ⏭️  Skipping ${file.name} (doesn't match pattern)`);
          continue;
        }

        try {
          // Download file from source
          const { data: fileData, error: downloadError } = await supabase.storage
            .from(migration.sourceBucket)
            .download(file.name);

          if (downloadError || !fileData) {
            console.error(`  ❌ Error downloading ${file.name}: ${downloadError?.message}`);
            continue;
          }

          // Determine target path
          const targetPath = migration.targetFolder
            ? `${migration.targetFolder}/${file.name}`
            : file.name;

          // Upload to target bucket
          const { error: uploadError } = await supabase.storage
            .from(migration.targetBucket)
            .upload(targetPath, fileData, {
              cacheControl: '3600',
              upsert: true, // Overwrite if exists
            });

          if (uploadError) {
            console.error(`  ❌ Error uploading ${file.name}: ${uploadError.message}`);
            continue;
          }

          console.log(`  ✅ Migrated: ${file.name} → ${targetPath}`);

          // Optionally delete from source (commented out for safety)
          // const { error: deleteError } = await supabase.storage
          //   .from(migration.sourceBucket)
          //   .remove([file.name]);
          //
          // if (deleteError) {
          //   console.error(`  ⚠️  Warning: Could not delete source file ${file.name}`);
          // }

        } catch (error) {
          console.error(`  ❌ Error migrating ${file.name}:`, error);
        }
      }

    } catch (error) {
      console.error(`  ❌ Unexpected error during migration:`, error);
    }
  }

  console.log('\n✨ Migration complete!');
  console.log('⚠️  Note: Original files were NOT deleted. Delete them manually after verifying the migration.');
}

async function updateDatabaseUrls() {
  console.log('\n🔄 Updating database URLs...\n');

  // This would typically update the database to point to new URLs
  // For example, updating event banner_url fields to use new bucket structure

  try {
    // Example: Update event banner URLs
    const { data: events, error: fetchError } = await supabase
      .from('events')
      .select('id, banner_url')
      .not('banner_url', 'is', null);

    if (fetchError) {
      console.error('Error fetching events:', fetchError);
      return;
    }

    if (events && events.length > 0) {
      console.log(`Found ${events.length} events with banner URLs to update`);

      for (const event of events) {
        if (event.banner_url && event.banner_url.includes('event-banners')) {
          // Replace old bucket URL with new one
          const newUrl = event.banner_url.replace(
            '/storage/v1/object/public/event-banners/',
            '/storage/v1/object/public/event-media/banners/'
          );

          const { error: updateError } = await supabase
            .from('events')
            .update({ banner_url: newUrl })
            .eq('id', event.id);

          if (updateError) {
            console.error(`Error updating event ${event.id}:`, updateError);
          } else {
            console.log(`✅ Updated event ${event.id} banner URL`);
          }
        }
      }
    }

  } catch (error) {
    console.error('Error updating database URLs:', error);
  }
}

// Run the migration
async function main() {
  console.log('=================================');
  console.log('Storage Migration Script');
  console.log('=================================\n');

  // Check if old bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const oldBucketExists = buckets?.some(b => b.name === 'event-banners');

  if (!oldBucketExists) {
    console.log('ℹ️  Old bucket "event-banners" not found. Nothing to migrate.');
    return;
  }

  // Run migrations
  await migrateFiles();

  // Update database URLs
  await updateDatabaseUrls();

  console.log('\n=================================');
  console.log('Migration completed successfully!');
  console.log('=================================');
  console.log('\nNext steps:');
  console.log('1. Verify all files were migrated correctly');
  console.log('2. Test the application to ensure everything works');
  console.log('3. Manually delete the old "event-banners" bucket if no longer needed');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});