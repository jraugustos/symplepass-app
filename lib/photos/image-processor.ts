/**
 * Image processor for event photos
 * Handles generation of multiple photo versions (original, watermarked, thumbnail)
 */

import { compressImage, getImageDimensions } from '@/lib/storage/image-utils';
import { applyWatermark } from './watermark';

/**
 * Processed photo versions with all three sizes
 */
export interface ProcessedPhotoVersions {
  original: File;
  watermarked: File;
  thumbnail: File;
  dimensions: {
    width: number;
    height: number;
  };
}

/**
 * Options for photo processing
 */
export interface PhotoProcessingOptions {
  watermarkText?: string;
  watermarkedMaxWidth?: number;
  watermarkedMaxHeight?: number;
  watermarkedQuality?: number;
  thumbnailMaxWidth?: number;
  thumbnailMaxHeight?: number;
  thumbnailQuality?: number;
}

const DEFAULT_OPTIONS: Required<PhotoProcessingOptions> = {
  watermarkText: 'Symplepass',
  watermarkedMaxWidth: 1920,
  watermarkedMaxHeight: 1440,
  watermarkedQuality: 0.85,
  thumbnailMaxWidth: 400,
  thumbnailMaxHeight: 300,
  thumbnailQuality: 0.7,
};

/**
 * Convert a Blob to a File object
 */
export function blobToFile(blob: Blob, fileName: string, mimeType: string): File {
  return new File([blob], fileName, {
    type: mimeType,
    lastModified: Date.now(),
  });
}

/**
 * Process an event photo into three versions:
 * - Original: unchanged, for paid downloads
 * - Watermarked: resized with watermark, for preview
 * - Thumbnail: small with watermark, for gallery grid
 *
 * @param file - The original image file
 * @param options - Processing options
 * @returns Object containing all three versions and original dimensions
 */
export async function processEventPhoto(
  file: File,
  options: PhotoProcessingOptions = {}
): Promise<ProcessedPhotoVersions> {
  // Validate input
  if (!file.type.startsWith('image/')) {
    throw new Error('O arquivo deve ser uma imagem');
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  console.log('[ImageProcessor] Starting photo processing:', file.name);

  try {
    // Get original dimensions
    const dimensions = await getImageDimensions(file);
    console.log('[ImageProcessor] Original dimensions:', dimensions);

    // Process watermarked version (medium size with watermark)
    console.log('[ImageProcessor] Creating watermarked version...');
    const resizedForWatermark = await compressImage(file, {
      maxWidth: opts.watermarkedMaxWidth,
      maxHeight: opts.watermarkedMaxHeight,
      quality: opts.watermarkedQuality,
    });

    const watermarkedBlob = await applyWatermark(resizedForWatermark, opts.watermarkText);
    const watermarkedFile = blobToFile(
      watermarkedBlob,
      `watermarked-${file.name}`,
      'image/jpeg'
    );
    console.log('[ImageProcessor] Watermarked version created:', watermarkedFile.size, 'bytes');

    // Process thumbnail version (small size with watermark)
    console.log('[ImageProcessor] Creating thumbnail version...');
    const resizedForThumbnail = await compressImage(file, {
      maxWidth: opts.thumbnailMaxWidth,
      maxHeight: opts.thumbnailMaxHeight,
      quality: opts.thumbnailQuality,
    });

    const thumbnailBlob = await applyWatermark(resizedForThumbnail, opts.watermarkText);
    const thumbnailFile = blobToFile(
      thumbnailBlob,
      `thumb-${file.name}`,
      'image/jpeg'
    );
    console.log('[ImageProcessor] Thumbnail version created:', thumbnailFile.size, 'bytes');

    console.log('[ImageProcessor] Photo processing complete');

    return {
      original: file,
      watermarked: watermarkedFile,
      thumbnail: thumbnailFile,
      dimensions,
    };
  } catch (error) {
    console.error('[ImageProcessor] Error processing photo:', error);
    throw new Error(
      `Erro ao processar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Process multiple photos in sequence
 *
 * @param files - Array of image files to process
 * @param options - Processing options
 * @param onProgress - Optional callback for progress updates
 * @returns Array of processed photo versions
 */
export async function processMultipleEventPhotos(
  files: File[],
  options: PhotoProcessingOptions = {},
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<ProcessedPhotoVersions[]> {
  const results: ProcessedPhotoVersions[] = [];
  const errors: { file: string; error: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      onProgress?.(i + 1, files.length, file.name);
      const processed = await processEventPhoto(file, options);
      results.push(processed);
    } catch (error) {
      console.error(`[ImageProcessor] Error processing ${file.name}:`, error);
      errors.push({
        file: file.name,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  if (errors.length > 0) {
    console.warn('[ImageProcessor] Some files failed to process:', errors);
  }

  return results;
}

/**
 * Validate that a file is a valid image for processing
 */
export function validateImageForProcessing(file: File): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!file) {
    errors.push('Nenhum arquivo fornecido');
    return { valid: false, errors };
  }

  if (!file.type.startsWith('image/')) {
    errors.push('O arquivo deve ser uma imagem');
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Tipo de imagem não suportado: ${file.type}. Use JPEG, PNG ou WebP.`);
  }

  // Max 50MB for original photos
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    errors.push(`Arquivo muito grande (${sizeMB}MB). Tamanho máximo: 50MB`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Estimate the total size of processed versions
 * Useful for showing expected upload size to users
 */
export function estimateProcessedSize(originalSize: number): {
  original: number;
  watermarked: number;
  thumbnail: number;
  total: number;
} {
  // Rough estimates based on compression ratios
  const watermarked = Math.min(originalSize * 0.3, 1024 * 1024); // ~30% or max 1MB
  const thumbnail = Math.min(originalSize * 0.05, 100 * 1024); // ~5% or max 100KB

  return {
    original: originalSize,
    watermarked: Math.round(watermarked),
    thumbnail: Math.round(thumbnail),
    total: Math.round(originalSize + watermarked + thumbnail),
  };
}
