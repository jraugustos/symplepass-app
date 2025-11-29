/**
 * Type definitions for the upload system
 */

export type FileType = 'image' | 'pdf' | 'gpx' | 'document' | 'any';

export type StorageBucket =
  | 'event-media'
  | 'event-documents'
  | 'event-routes'
  | 'kit-items'
  | 'user-avatars'
  | 'organizer-assets'
  | 'event-banners';

export interface FileConstraints {
  maxSize: number; // in bytes
  allowedTypes: string[]; // MIME types
  allowedExtensions: string[];
}

export interface UploadOptions {
  bucket: StorageBucket;
  folder?: string;
  fileName?: string;
  generateThumbnail?: boolean;
  compress?: boolean;
  public?: boolean;
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
  thumbnailUrl?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}

export interface BucketConfig {
  name: StorageBucket;
  public: boolean;
  fileType: FileType;
  constraints: FileConstraints;
  folder?: string;
}

export interface UploadError {
  code: string;
  message: string;
  details?: any;
}

export type UploadStatus = 'idle' | 'validating' | 'uploading' | 'success' | 'error';

export interface UploadState {
  status: UploadStatus;
  progress: number;
  error?: UploadError;
  result?: UploadResult;
}