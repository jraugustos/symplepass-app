/**
 * Main upload service for handling file uploads to Supabase Storage
 */

import { createClient } from '@/lib/supabase/client';
import type {
  UploadOptions,
  UploadResult,
  UploadError,
  StorageBucket,
  FileValidationResult,
} from './upload-types';
import {
  validateFileForBucket,
  generateUniqueFilename,
  sanitizeFilename,
} from './file-validators';
// getBucketConfig available from './storage-config' when needed

export class UploadService {
  private supabase = createClient();

  /**
   * Upload a single file to Supabase Storage
   */
  async uploadFile(
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file, options.bucket);
      if (!validation.valid) {
        throw this.createError('VALIDATION_ERROR', validation.errors.join('; '));
      }

      // Generate file path
      const fileName = options.fileName
        ? sanitizeFilename(options.fileName)
        : generateUniqueFilename(file.name);

      const filePath = options.folder
        ? `${options.folder}/${fileName}`
        : fileName;

      const { data, error } = await this.supabase.storage
        .from(options.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw this.createError('UPLOAD_ERROR', error.message, error);
      }

      if (!data) {
        throw this.createError('UPLOAD_ERROR', 'No data returned from upload');
      }

      // Get public URL if bucket is public
      const url = await this.getFileUrl(options.bucket, filePath, options.public);

      // Optionally generate thumbnail (for images)
      let thumbnailUrl: string | undefined;
      if (options.generateThumbnail && this.isImage(file)) {
        thumbnailUrl = await this.generateThumbnail(file, options);
      }

      return {
        url,
        path: filePath,
        size: file.size,
        type: file.type,
        thumbnailUrl,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw this.createError('UNKNOWN_ERROR', 'Falha ao fazer upload do arquivo');
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: File[],
    options: UploadOptions
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, options)
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(bucket: StorageBucket, path: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Erro ao deletar arquivo:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      return false;
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(
    bucket: StorageBucket,
    paths: string[]
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove(paths);

      if (error) {
        console.error('Erro ao deletar arquivos:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao deletar arquivos:', error);
      return false;
    }
  }

  /**
   * Get file URL
   */
  async getFileUrl(
    bucket: StorageBucket,
    path: string,
    isPublic: boolean = true
  ): Promise<string> {
    if (isPublic) {
      const { data } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return data.publicUrl;
    }

    // For private files, generate a signed URL
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error || !data) {
      throw this.createError('URL_ERROR', 'Falha ao gerar URL do arquivo');
    }

    return data.signedUrl;
  }

  /**
   * Move a file to a different location
   */
  async moveFile(
    bucket: StorageBucket,
    fromPath: string,
    toPath: string
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .move(fromPath, toPath);

      if (error) {
        console.error('Erro ao mover arquivo:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao mover arquivo:', error);
      return false;
    }
  }

  /**
   * Copy a file to a different location
   */
  async copyFile(
    bucket: StorageBucket,
    fromPath: string,
    toPath: string
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .copy(fromPath, toPath);

      if (error) {
        console.error('Erro ao copiar arquivo:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao copiar arquivo:', error);
      return false;
    }
  }

  /**
   * List files in a bucket
   */
  async listFiles(
    bucket: StorageBucket,
    folder?: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: {
        column?: string;
        order?: string;
      };
    }
  ) {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(folder, options);

      if (error) {
        throw this.createError('LIST_ERROR', error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      return [];
    }
  }

  /**
   * Download a file
   */
  async downloadFile(
    bucket: StorageBucket,
    path: string
  ): Promise<Blob | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .download(path);

      if (error) {
        console.error('Erro ao baixar arquivo:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      return null;
    }
  }

  /**
   * Validate file for specific bucket
   */
  private validateFile(
    file: File,
    bucket: StorageBucket
  ): FileValidationResult {
    return validateFileForBucket(file, bucket);
  }

  /**
   * Check if file is an image
   */
  private isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Generate thumbnail for an image (placeholder - implement with image processing library)
   */
  private async generateThumbnail(
    _file: File,
    _options: UploadOptions
  ): Promise<string | undefined> {
    // Thumbnail generation not implemented yet
    // When implemented, would resize image and upload to thumbnails folder
    return undefined;
  }

  /**
   * Create an upload error
   */
  private createError(
    code: string,
    message: string,
    details?: any
  ): UploadError {
    return {
      code,
      message,
      details,
    };
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(bucket: StorageBucket, path: string) {
    try {
      const { data } = await this.downloadFile(bucket, path) as any;

      if (!data) {
        return null;
      }

      return {
        size: data.size,
        type: data.type,
        lastModified: data.lastModified,
      };
    } catch (error) {
      console.error('Erro ao obter metadados:', error);
      return null;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(bucket: StorageBucket, path: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(path.split('/').slice(0, -1).join('/'), {
          limit: 1,
          search: path.split('/').pop(),
        });

      return !error && data && data.length > 0;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const uploadService = new UploadService();