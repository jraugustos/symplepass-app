/**
 * Script to download face-api.js models
 *
 * Run with: npx tsx scripts/download-face-models.ts
 *
 * Downloads the following models to /public/models/:
 * - ssd_mobilenetv1_model (face detection)
 * - face_landmark_68_model (face landmarks)
 * - face_recognition_model (face embeddings)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const MODELS_DIR = path.join(process.cwd(), 'public', 'models');

// Base URL for model files (vladmandic's face-api repository)
const BASE_URL =
  'https://raw.githubusercontent.com/vladmandic/face-api/master/model';

// Models to download with their files
// Note: vladmandic/face-api uses single .bin files instead of sharded files
const MODELS = {
  ssd_mobilenetv1: [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model.bin',
  ],
  face_landmark_68: [
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model.bin',
  ],
  face_recognition: [
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model.bin',
  ],
};

/**
 * Download a file from URL to local path
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    https
      .get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 302 || response.statusCode === 301) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            file.close();
            fs.unlinkSync(destPath);
            downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(destPath);
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        file.close();
        if (fs.existsSync(destPath)) {
          fs.unlinkSync(destPath);
        }
        reject(err);
      });
  });
}

/**
 * Main function to download all models
 */
async function downloadModels(): Promise<void> {
  console.log('🔍 Face-API Models Downloader\n');

  // Create models directory if it doesn't exist
  if (!fs.existsSync(MODELS_DIR)) {
    console.log(`📁 Creating directory: ${MODELS_DIR}`);
    fs.mkdirSync(MODELS_DIR, { recursive: true });
  }

  let totalFiles = 0;
  let downloadedFiles = 0;
  let skippedFiles = 0;

  // Count total files
  for (const files of Object.values(MODELS)) {
    totalFiles += files.length;
  }

  console.log(`📦 Downloading ${totalFiles} model files...\n`);

  for (const [modelName, files] of Object.entries(MODELS)) {
    console.log(`\n📂 Model: ${modelName}`);

    for (const fileName of files) {
      const url = `${BASE_URL}/${fileName}`;
      const destPath = path.join(MODELS_DIR, fileName);

      // Check if file already exists
      if (fs.existsSync(destPath)) {
        console.log(`   ⏭️  ${fileName} (already exists)`);
        skippedFiles++;
        continue;
      }

      try {
        process.stdout.write(`   ⬇️  ${fileName}...`);
        await downloadFile(url, destPath);
        console.log(' ✅');
        downloadedFiles++;
      } catch (error) {
        console.log(' ❌');
        console.error(
          `      Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   Downloaded: ${downloadedFiles} files`);
  console.log(`   Skipped: ${skippedFiles} files (already exist)`);
  console.log(`   Total: ${totalFiles} files`);

  if (downloadedFiles + skippedFiles === totalFiles) {
    console.log('\n✅ All models ready!');
    console.log(`   Location: ${MODELS_DIR}`);
  } else {
    console.log('\n⚠️  Some files failed to download. Please try again.');
  }
}

// Run the script
downloadModels().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
