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
  // Get a fresh client for each operation to ensure auth token is current
  private getClient() {
    return createClient();
  }

  /**
   * Validates the current session and refreshes the token if needed.
   * Throws an error if the user is not authenticated.
   */
  private async getValidatedClient() {
    const supabase = createClient();

    // Verify session exists
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw this.createError('AUTH_ERROR', 'Sessão expirada. Por favor, faça login novamente.');
    }

    // Try to refresh the session to ensure token is fresh
    const { error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError) {
      console.warn('[UploadService] Failed to refresh session:', refreshError.message);
      // Continue with existing session if refresh fails but session exists
    }

    return supabase;
  }

  /**
   * Upload a single file to Supabase Storage via server-side API
   * This approach bypasses RLS issues by using the admin client on the server
   */
  async uploadFile(
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      // Validate file locally first (faster feedback)
      const validation = this.validateFile(file, options.bucket);
      if (!validation.valid) {
        throw this.createError('VALIDATION_ERROR', validation.errors.join('; '));
      }

      // Validate folder is provided for event-related buckets
      const eventBuckets = ['event-banners', 'event-media', 'event-documents', 'event-routes', 'kit-items', 'event-photos', 'event-photos-watermarked'];
      if (eventBuckets.includes(options.bucket) && !options.folder) {
        throw this.createError('VALIDATION_ERROR', 'Salve o evento primeiro para habilitar o upload.');
      }

      console.log('[UploadService] Starting upload to', options.bucket, 'folder:', options.folder);

      // Create form data for API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', options.bucket);
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      if (options.fileName) {
        formData.append('fileName', options.fileName);
      }

      // Upload via server-side API (bypasses RLS, validates permissions in code)
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API upload error:', result);
        throw this.createError('UPLOAD_ERROR', result.error || 'Erro ao fazer upload.');
      }

      // Optionally generate thumbnail (for images)
      let thumbnailUrl: string | undefined;
      if (options.generateThumbnail && this.isImage(file)) {
        thumbnailUrl = await this.generateThumbnail(file, options);
      }

      return {
        url: result.url,
        path: result.path,
        size: result.size || file.size,
        type: result.type || file.type,
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
      const supabase = this.getClient();
      const { error } = await supabase.storage
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
      const supabase = this.getClient();
      const { error } = await supabase.storage
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
   * @param bucket - The storage bucket
   * @param path - The file path
   * @param isPublic - Whether to get public URL (true) or signed URL (false)
   * @param expiresIn - Expiration time in seconds for signed URLs (default: 3600 = 1 hour)
   */
  async getFileUrl(
    bucket: StorageBucket,
    path: string,
    isPublic: boolean = true,
    expiresIn: number = 3600
  ): Promise<string> {
    const supabase = this.getClient();

    if (isPublic) {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return data.publicUrl;
    }

    // For private files, generate a signed URL
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

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
      const supabase = this.getClient();
      const { error } = await supabase.storage
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
      const supabase = this.getClient();
      const { error } = await supabase.storage
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
      const supabase = this.getClient();
      const { data, error } = await supabase.storage
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
      const supabase = this.getClient();
      const { data, error } = await supabase.storage
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
   * Maps Supabase storage errors to user-friendly messages
   */
  private getUploadErrorMessage(error: any, bucket: string): string {
    const message = error.message || '';

    if (message.includes('Bucket not found')) {
      return `Bucket "${bucket}" não encontrado. Verifique a configuração do storage.`;
    }
    if (message.includes('row-level security') || message.includes('policy') || message.includes('violates')) {
      return 'Permissão negada. Verifique se você tem permissão para fazer upload neste evento.';
    }
    if (message.includes('JWT') || message.includes('token') || message.includes('expired')) {
      return 'Sessão expirada. Por favor, faça login novamente.';
    }
    if (message.includes('Invalid') || message.includes('malformed')) {
      return 'Sessão inválida. Por favor, faça login novamente.';
    }

    return message;
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
      const supabase = this.getClient();
      const { data, error } = await supabase.storage
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