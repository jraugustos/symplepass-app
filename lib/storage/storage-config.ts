/**
 * Centralized storage configuration for all buckets
 */

import type { BucketConfig } from './upload-types';

export const STORAGE_BUCKETS: Record<string, BucketConfig> = {
  EVENT_BANNERS: {
    name: 'event-banners',
    public: true,
    fileType: 'image',
    constraints: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'],
    },
  },
  EVENT_MEDIA: {
    name: 'event-media',
    public: true,
    fileType: 'image',
    constraints: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'],
    },
  },
  EVENT_DOCUMENTS: {
    name: 'event-documents',
    public: true,
    fileType: 'pdf',
    constraints: {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: ['application/pdf'],
      allowedExtensions: ['.pdf'],
    },
  },
  EVENT_ROUTES: {
    name: 'event-routes',
    public: true,
    fileType: 'gpx',
    constraints: {
      maxSize: 20 * 1024 * 1024, // 20MB
      allowedTypes: [
        'application/gpx+xml',
        'application/xml',
        'text/xml',
      ],
      allowedExtensions: ['.gpx'],
    },
  },
  KIT_ITEMS: {
    name: 'kit-items',
    public: true,
    fileType: 'image',
    constraints: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    },
  },
  USER_AVATARS: {
    name: 'user-avatars',
    public: true,
    fileType: 'image',
    constraints: {
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    },
  },
  ORGANIZER_ASSETS: {
    name: 'organizer-assets',
    public: true,
    fileType: 'image',
    constraints: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/svg+xml',
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.svg'],
    },
  },
};

// Helper to get bucket config by name
export function getBucketConfig(bucketName: string): BucketConfig | undefined {
  return Object.values(STORAGE_BUCKETS).find(
    (config) => config.name === bucketName
  );
}

// Helper to get bucket config by file type
export function getBucketByFileType(fileType: string): BucketConfig | undefined {
  const mimeToFileType: Record<string, string> = {
    'image/jpeg': 'image',
    'image/jpg': 'image',
    'image/png': 'image',
    'image/webp': 'image',
    'image/gif': 'image',
    'image/svg+xml': 'image',
    'application/pdf': 'pdf',
    'application/gpx+xml': 'gpx',
    'application/xml': 'gpx',
    'text/xml': 'gpx',
  };

  const type = mimeToFileType[fileType];
  if (!type) return undefined;

  return Object.values(STORAGE_BUCKETS).find(
    (config) => config.fileType === type
  );
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// Get max file size for a bucket
export function getMaxFileSizeForBucket(bucketName: string): number {
  const config = getBucketConfig(bucketName);
  return config?.constraints.maxSize || 10 * 1024 * 1024; // Default to 10MB
}