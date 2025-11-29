/**
 * File validation utilities for upload system
 */

import type { FileConstraints, FileValidationResult } from './upload-types';
import { getBucketConfig } from './storage-config';

/**
 * Validates a file against constraints
 */
export function validateFile(
  file: File,
  constraints: FileConstraints
): FileValidationResult {
  const errors: string[] = [];

  // Check file size
  if (file.size > constraints.maxSize) {
    const maxSizeMB = (constraints.maxSize / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    errors.push(`O arquivo é muito grande (${fileSizeMB}MB). Tamanho máximo: ${maxSizeMB}MB`);
  }

  // Check file type
  const isValidType = constraints.allowedTypes.includes(file.type);
  if (!isValidType && file.type) {
    // Sometimes MIME type is not detected, check extension
    const extension = getFileExtension(file.name);
    const isValidExtension = constraints.allowedExtensions.includes(extension.toLowerCase());

    if (!isValidExtension) {
      errors.push(
        `Tipo de arquivo não permitido. Tipos aceitos: ${constraints.allowedExtensions.join(', ')}`
      );
    }
  }

  // Check file extension as fallback
  const extension = getFileExtension(file.name);
  if (!constraints.allowedExtensions.includes(extension.toLowerCase())) {
    errors.push(
      `Extensão de arquivo não permitida. Extensões aceitas: ${constraints.allowedExtensions.join(', ')}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a file for a specific bucket
 */
export function validateFileForBucket(
  file: File,
  bucketName: string
): FileValidationResult {
  const bucketConfig = getBucketConfig(bucketName);

  if (!bucketConfig) {
    return {
      valid: false,
      errors: [`Bucket '${bucketName}' não configurado`],
    };
  }

  return validateFile(file, bucketConfig.constraints);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.substring(lastDot);
}

/**
 * Generate a unique filename with timestamp and UUID
 */
export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 9);
  const extension = getFileExtension(originalFilename);
  const nameWithoutExt = originalFilename.replace(extension, '');

  // Sanitize filename
  const sanitized = nameWithoutExt
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50); // Limit length

  return `${sanitized}-${timestamp}-${randomString}${extension}`;
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  const extension = getFileExtension(filename);
  const nameWithoutExt = filename.replace(extension, '');

  const sanitized = nameWithoutExt
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
    .substring(0, 100); // Limit length

  return sanitized ? `${sanitized}${extension}` : `file${extension}`;
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  const imageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  if (imageTypes.includes(file.type)) {
    return true;
  }

  // Check extension as fallback
  const extension = getFileExtension(file.name).toLowerCase();
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

  return imageExtensions.includes(extension);
}

/**
 * Check if file is a PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' ||
         getFileExtension(file.name).toLowerCase() === '.pdf';
}

/**
 * Check if file is a GPX file
 */
export function isGPXFile(file: File): boolean {
  const gpxTypes = [
    'application/gpx+xml',
    'application/xml',
    'text/xml',
  ];

  return gpxTypes.includes(file.type) ||
         getFileExtension(file.name).toLowerCase() === '.gpx';
}

/**
 * Get appropriate icon for file type
 */
export function getFileTypeIcon(file: File): string {
  if (isImageFile(file)) return '🖼️';
  if (isPDFFile(file)) return '📄';
  if (isGPXFile(file)) return '🗺️';
  return '📎';
}

/**
 * Validate multiple files
 */
export function validateMultipleFiles(
  files: File[],
  constraints: FileConstraints,
  maxFiles?: number
): FileValidationResult {
  const errors: string[] = [];

  // Check number of files
  if (maxFiles && files.length > maxFiles) {
    errors.push(`Número máximo de arquivos excedido. Máximo: ${maxFiles}`);
  }

  // Validate each file
  files.forEach((file, index) => {
    const result = validateFile(file, constraints);
    if (!result.valid) {
      result.errors.forEach(error => {
        errors.push(`Arquivo ${index + 1} (${file.name}): ${error}`);
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}