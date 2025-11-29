/**
 * Image processing utilities for upload system
 */

/**
 * Compress an image file
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options;

  // Skip compression for non-image files
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Skip compression if running on server
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('Image compression skipped: not in browser environment');
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            console.warn('Failed to get canvas context, returning original file');
            resolve(file);
            return;
          }

        // Calculate new dimensions
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw the image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              console.warn('Failed to compress image, returning original');
              resolve(file);
              return;
            }

            // Create a new file with the compressed blob
            const compressedFile = new File(
              [blob],
              file.name,
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
        } catch (error) {
          console.error('Error during compression:', error);
          resolve(file); // Return original file if compression fails
        }
      };

      img.onerror = () => {
        console.error('Failed to load image for compression');
        resolve(file); // Return original file if loading fails
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      console.error('Failed to read file for compression');
      resolve(file); // Return original file if reading fails
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Generate a thumbnail from an image file
 */
export async function generateThumbnail(
  file: File,
  size: number = 200
): Promise<File> {
  return compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
  });
}

/**
 * Get image dimensions from a file
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      console.error('Failed to read file for compression');
      reject(new Error('Failed to read file')); // Reject on error
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Convert image to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      console.error('Failed to read file for compression');
      reject(new Error('Failed to read file')); // Reject on error
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Create a preview URL for an image file
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke a preview URL to free memory
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Check if image needs compression based on size
 */
export function needsCompression(
  file: File,
  maxSize: number = 1024 * 1024 // 1MB default
): boolean {
  return file.size > maxSize && file.type.startsWith('image/');
}

/**
 * Auto-rotate image based on EXIF orientation
 */
export async function autoRotateImage(file: File): Promise<File> {
  // This is a simplified version - for full EXIF support,
  // you would need a library like exif-js or piexifjs

  return new Promise((resolve) => {
    // For now, just return the original file
    // In production, parse EXIF and rotate if needed
    resolve(file);
  });
}