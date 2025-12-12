/**
 * Photo Upload Service
 * Specialized service for uploading event photos with automatic processing
 * (original, watermarked, thumbnail versions)
 */

import { uploadService } from '@/lib/storage/upload-service';
import { validateFileForBucket, getFileExtension } from '@/lib/storage/file-validators';
import { createClient } from '@/lib/supabase/client';
import {
  processEventPhoto,
  validateImageForProcessing,
  type ProcessedPhotoVersions,
  type PhotoProcessingOptions,
} from './image-processor';

/**
 * Result of a photo upload operation
 */
export interface PhotoUploadResult {
  photoId: string;
  originalPath: string;
  watermarkedPath: string;
  thumbnailPath: string;
  originalUrl: string;
  watermarkedUrl: string;
  thumbnailUrl: string;
  fileSize: number;
  fileName: string;
  dimensions: {
    width: number;
    height: number;
  };
}

/**
 * Error during photo upload
 */
export interface PhotoUploadError {
  fileName: string;
  error: string;
}

/**
 * Result of multiple photo uploads
 */
export interface MultiplePhotoUploadResult {
  successful: PhotoUploadResult[];
  failed: PhotoUploadError[];
}

/**
 * Storage bucket names for photos
 */
const PHOTO_BUCKETS = {
  ORIGINAL: 'event-photos' as const,
  WATERMARKED: 'event-photos-watermarked' as const,
};

/**
 * Photo Upload Service class
 * Handles processing and upload of event photos to Supabase Storage
 */
export class PhotoUploadService {
  private lastTokenRefresh: number = 0;
  private readonly TOKEN_REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes

  /**
   * Refresh the auth token if needed to prevent session expiration during long uploads
   * This is especially important when uploading many photos sequentially
   * Note: This is non-blocking - failures won't stop the upload process
   */
  private async refreshTokenIfNeeded(): Promise<void> {
    const now = Date.now();
    // Only refresh after the interval has passed (not on the first call)
    if (this.lastTokenRefresh > 0 && (now - this.lastTokenRefresh) < this.TOKEN_REFRESH_INTERVAL) {
      return; // Not time to refresh yet
    }

    // Mark that we attempted refresh (even if it fails, wait before trying again)
    this.lastTokenRefresh = now;

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.warn('[PhotoUploadService] Token refresh failed:', error.message);
        // Don't throw - let uploads continue with existing session
      } else {
        console.log('[PhotoUploadService] Token refreshed successfully');
      }
    } catch (err) {
      console.warn('[PhotoUploadService] Token refresh error:', err);
      // Don't throw - let uploads continue with existing session
    }
  }

  /**
   * Upload a single event photo with automatic processing
   * Creates three versions: original, watermarked, and thumbnail
   *
   * @param file - The image file to upload
   * @param eventId - The event ID (used for folder organization)
   * @param options - Optional processing options
   * @returns Upload result with all paths and URLs
   */
  async uploadEventPhoto(
    file: File,
    eventId: string,
    options?: PhotoProcessingOptions
  ): Promise<PhotoUploadResult> {
    // Validate event ID
    if (!eventId) {
      throw new Error('ID do evento é obrigatório');
    }

    console.log('[PhotoUploadService] Starting upload for:', file.name, 'event:', eventId);

    // Validate file for processing
    const processingValidation = validateImageForProcessing(file);
    if (!processingValidation.valid) {
      throw new Error(processingValidation.errors.join('; '));
    }

    // Validate file for bucket constraints
    const bucketValidation = validateFileForBucket(file, PHOTO_BUCKETS.ORIGINAL);
    if (!bucketValidation.valid) {
      throw new Error(bucketValidation.errors.join('; '));
    }

    // Generate unique photo ID
    const photoId = crypto.randomUUID();
    const extension = getFileExtension(file.name) || '.jpg';

    // Process image into three versions
    console.log('[PhotoUploadService] Processing image...');
    let processed: ProcessedPhotoVersions;
    try {
      processed = await processEventPhoto(file, options);
    } catch (error) {
      console.error('[PhotoUploadService] Processing failed:', error);
      throw new Error(
        `Erro ao processar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }

    // Define paths for each version
    const paths = {
      original: `photo-${photoId}${extension}`,
      watermarked: `watermarked/photo-${photoId}${extension}`,
      thumbnail: `thumbnails/photo-${photoId}${extension}`,
    };

    // Track uploaded files for rollback
    const uploadedFiles: { bucket: string; path: string }[] = [];

    try {
      // Upload original (private bucket)
      console.log('[PhotoUploadService] Uploading original...');
      const originalResult = await uploadService.uploadFile(processed.original, {
        bucket: PHOTO_BUCKETS.ORIGINAL,
        folder: eventId,
        fileName: paths.original,
      });
      uploadedFiles.push({ bucket: PHOTO_BUCKETS.ORIGINAL, path: `${eventId}/${paths.original}` });

      // Upload watermarked (public bucket)
      console.log('[PhotoUploadService] Uploading watermarked...');
      const watermarkedResult = await uploadService.uploadFile(processed.watermarked, {
        bucket: PHOTO_BUCKETS.WATERMARKED,
        folder: eventId,
        fileName: paths.watermarked,
      });
      uploadedFiles.push({
        bucket: PHOTO_BUCKETS.WATERMARKED,
        path: `${eventId}/${paths.watermarked}`,
      });

      // Upload thumbnail (public bucket)
      console.log('[PhotoUploadService] Uploading thumbnail...');
      const thumbnailResult = await uploadService.uploadFile(processed.thumbnail, {
        bucket: PHOTO_BUCKETS.WATERMARKED,
        folder: eventId,
        fileName: paths.thumbnail,
      });
      uploadedFiles.push({
        bucket: PHOTO_BUCKETS.WATERMARKED,
        path: `${eventId}/${paths.thumbnail}`,
      });

      console.log('[PhotoUploadService] Upload complete for photo:', photoId);

      return {
        photoId,
        originalPath: `${eventId}/${paths.original}`,
        watermarkedPath: `${eventId}/${paths.watermarked}`,
        thumbnailPath: `${eventId}/${paths.thumbnail}`,
        originalUrl: originalResult.url,
        watermarkedUrl: watermarkedResult.url,
        thumbnailUrl: thumbnailResult.url,
        fileSize: file.size,
        fileName: file.name,
        dimensions: processed.dimensions,
      };
    } catch (error) {
      // Rollback: delete any files that were uploaded
      console.error('[PhotoUploadService] Upload failed, rolling back...');
      await this.rollbackUploads(uploadedFiles);

      throw new Error(
        `Erro ao fazer upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }
  }

  /**
   * Upload multiple event photos with progress callback
   *
   * @param files - Array of image files to upload
   * @param eventId - The event ID
   * @param onProgress - Optional progress callback (current, total)
   * @param options - Optional processing options
   * @returns Result with successful uploads and failures
   */
  async uploadMultipleEventPhotos(
    files: File[],
    eventId: string,
    onProgress?: (current: number, total: number, fileName: string) => void,
    options?: PhotoProcessingOptions
  ): Promise<MultiplePhotoUploadResult> {
    const successful: PhotoUploadResult[] = [];
    const failed: PhotoUploadError[] = [];

    // Initialize token refresh timer at start of batch upload
    // This ensures first refresh happens after TOKEN_REFRESH_INTERVAL, not immediately
    if (this.lastTokenRefresh === 0) {
      this.lastTokenRefresh = Date.now();
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Refresh token periodically to prevent session expiration during long uploads
        // This is called every iteration but only actually refreshes after TOKEN_REFRESH_INTERVAL
        await this.refreshTokenIfNeeded();

        onProgress?.(i + 1, files.length, file.name);

        const result = await this.uploadEventPhoto(file, eventId, options);
        successful.push(result);
      } catch (error) {
        console.error(`[PhotoUploadService] Failed to upload ${file.name}:`, error);

        // Check if the error is auth-related and try to recover
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        if (errorMessage.includes('Não autorizado') || errorMessage.includes('login')) {
          // Try to refresh the token and retry once
          try {
            console.log('[PhotoUploadService] Auth error detected, attempting token refresh...');
            const supabase = createClient();
            const { error: refreshError } = await supabase.auth.refreshSession();

            if (!refreshError) {
              console.log('[PhotoUploadService] Token refreshed, retrying upload...');
              // Retry the upload
              const result = await this.uploadEventPhoto(file, eventId, options);
              successful.push(result);
              continue; // Skip adding to failed
            } else {
              console.error('[PhotoUploadService] Token refresh failed:', refreshError.message);
            }
          } catch (retryError) {
            console.error(`[PhotoUploadService] Retry also failed for ${file.name}:`, retryError);
          }
        }

        failed.push({
          fileName: file.name,
          error: errorMessage,
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Delete an event photo (all three versions)
   *
   * @param photoId - The photo ID (UUID portion of the filename)
   * @param eventId - The event ID
   * @param extension - The file extension (e.g., '.jpg')
   * @returns True if all deletions successful
   */
  async deleteEventPhoto(
    photoId: string,
    eventId: string,
    extension: string = '.jpg'
  ): Promise<boolean> {
    console.log('[PhotoUploadService] Deleting photo:', photoId);

    const paths = {
      original: `${eventId}/photo-${photoId}${extension}`,
      watermarked: `${eventId}/watermarked/photo-${photoId}${extension}`,
      thumbnail: `${eventId}/thumbnails/photo-${photoId}${extension}`,
    };

    const results = await Promise.all([
      uploadService.deleteFile(PHOTO_BUCKETS.ORIGINAL, paths.original),
      uploadService.deleteFile(PHOTO_BUCKETS.WATERMARKED, paths.watermarked),
      uploadService.deleteFile(PHOTO_BUCKETS.WATERMARKED, paths.thumbnail),
    ]);

    const allDeleted = results.every((r) => r);

    if (!allDeleted) {
      console.warn('[PhotoUploadService] Some files could not be deleted');
    }

    return allDeleted;
  }

  /**
   * Delete multiple photos
   *
   * @param photos - Array of { photoId, eventId, extension }
   * @returns Number of successfully deleted photos
   */
  async deleteMultipleEventPhotos(
    photos: { photoId: string; eventId: string; extension?: string }[]
  ): Promise<number> {
    let deletedCount = 0;

    for (const photo of photos) {
      const success = await this.deleteEventPhoto(
        photo.photoId,
        photo.eventId,
        photo.extension || '.jpg'
      );
      if (success) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Get signed URL for downloading original (private) photo
   * Use this for paid downloads
   *
   * @param eventId - The event ID
   * @param photoId - The photo ID
   * @param extension - The file extension
   * @param expiresIn - URL expiration in seconds (default: 3600 = 1 hour)
   * @returns Signed URL for download
   */
  async getDownloadUrl(
    eventId: string,
    photoId: string,
    extension: string = '.jpg',
    expiresIn: number = 3600
  ): Promise<string> {
    const path = `${eventId}/photo-${photoId}${extension}`;
    return uploadService.getFileUrl(PHOTO_BUCKETS.ORIGINAL, path, false, expiresIn);
  }

  /**
   * Get public URL for watermarked photo (for preview)
   */
  getWatermarkedUrl(eventId: string, photoId: string, extension: string = '.jpg'): string {
    const path = `${eventId}/watermarked/photo-${photoId}${extension}`;
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${baseUrl}/storage/v1/object/public/${PHOTO_BUCKETS.WATERMARKED}/${path}`;
  }

  /**
   * Get public URL for thumbnail (for gallery grid)
   */
  getThumbnailUrl(eventId: string, photoId: string, extension: string = '.jpg'): string {
    const path = `${eventId}/thumbnails/photo-${photoId}${extension}`;
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${baseUrl}/storage/v1/object/public/${PHOTO_BUCKETS.WATERMARKED}/${path}`;
  }

  /**
   * Extract photo UUID and extension from storage path
   * Path format: {eventId}/photo-{uuid}.{ext} or {eventId}/watermarked/photo-{uuid}.{ext}
   *
   * @param path - Storage path (e.g., "abc123/photo-550e8400-e29b-41d4-a716-446655440000.jpg")
   * @returns Object with photoId (UUID) and extension, or null if invalid
   */
  extractPhotoIdFromPath(path: string): { photoId: string; extension: string } | null {
    // Match pattern: photo-{uuid}.{ext}
    const match = path.match(/photo-([a-f0-9-]{36})(\.[a-z]+)$/i);
    if (!match) {
      return null;
    }
    return {
      photoId: match[1],
      extension: match[2],
    };
  }

  /**
   * Delete an event photo by storage path
   * Extracts UUID from path and deletes all three versions
   *
   * @param originalPath - The original_path from database
   * @returns True if all deletions successful
   */
  async deleteEventPhotoByPath(originalPath: string): Promise<boolean> {
    const extracted = this.extractPhotoIdFromPath(originalPath);
    if (!extracted) {
      console.error('[PhotoUploadService] Could not extract photoId from path:', originalPath);
      return false;
    }

    // Extract eventId from path (first segment)
    const eventId = originalPath.split('/')[0];
    if (!eventId) {
      console.error('[PhotoUploadService] Could not extract eventId from path:', originalPath);
      return false;
    }

    return this.deleteEventPhoto(extracted.photoId, eventId, extracted.extension);
  }

  /**
   * Rollback uploaded files in case of failure
   */
  private async rollbackUploads(
    files: { bucket: string; path: string }[]
  ): Promise<void> {
    for (const file of files) {
      try {
        await uploadService.deleteFile(file.bucket as any, file.path);
        console.log('[PhotoUploadService] Rolled back:', file.path);
      } catch (error) {
        console.error('[PhotoUploadService] Failed to rollback:', file.path, error);
      }
    }
  }
}

// Export singleton instance
export const photoUploadService = new PhotoUploadService();
