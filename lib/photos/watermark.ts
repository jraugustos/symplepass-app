/**
 * Watermark utility for applying diagonal repeated watermarks to images
 */

/**
 * Apply a diagonal repeated watermark to an image file
 * @param imageFile - The image file to watermark
 * @param watermarkText - The text to use as watermark (default: "Symplepass")
 * @returns A Blob of the watermarked image
 */
export async function applyWatermark(
  imageFile: File | Blob,
  watermarkText: string = 'Symplepass'
): Promise<Blob> {
  // Check if running in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('[Watermark] Not in browser environment, returning original');
    if (imageFile instanceof File) {
      return new Blob([imageFile], { type: imageFile.type });
    }
    return imageFile;
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
            console.warn('[Watermark] Failed to get canvas context');
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Set canvas dimensions to match image
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw the original image
          ctx.drawImage(img, 0, 0);

          // Configure watermark style
          ctx.font = 'bold 36px Arial';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Calculate diagonal coverage
          const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);
          const horizontalSpacing = 300;
          const verticalSpacing = 150;

          // Save context state
          ctx.save();

          // Move to center and rotate -45 degrees
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(-Math.PI / 4); // -45 degrees

          // Calculate grid size needed to cover rotated canvas
          const gridWidth = diagonal * 1.5;
          const gridHeight = diagonal * 1.5;

          // Draw watermark in grid pattern
          for (let y = -gridHeight / 2; y < gridHeight / 2; y += verticalSpacing) {
            for (let x = -gridWidth / 2; x < gridWidth / 2; x += horizontalSpacing) {
              ctx.fillText(watermarkText, x, y);
            }
          }

          // Restore context state
          ctx.restore();

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.error('[Watermark] Failed to create blob');
                reject(new Error('Failed to create watermarked image blob'));
                return;
              }
              resolve(blob);
            },
            'image/jpeg',
            0.85
          );
        } catch (error) {
          console.error('[Watermark] Error during processing:', error);
          reject(error);
        }
      };

      img.onerror = () => {
        console.error('[Watermark] Failed to load image');
        reject(new Error('Failed to load image for watermarking'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      console.error('[Watermark] Failed to read file');
      reject(new Error('Failed to read file for watermarking'));
    };

    reader.readAsDataURL(imageFile);
  });
}

/**
 * Apply watermark with custom styling options
 */
export async function applyCustomWatermark(
  imageFile: File | Blob,
  options: {
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    opacity?: number;
    angle?: number;
    horizontalSpacing?: number;
    verticalSpacing?: number;
  } = {}
): Promise<Blob> {
  const {
    text = 'Symplepass',
    fontSize = 36,
    fontFamily = 'Arial',
    color = '255, 255, 255',
    opacity = 0.3,
    angle = -45,
    horizontalSpacing = 300,
    verticalSpacing = 150,
  } = options;

  // Check if running in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('[Watermark] Not in browser environment, returning original');
    if (imageFile instanceof File) {
      return new Blob([imageFile], { type: imageFile.type });
    }
    return imageFile;
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
            reject(new Error('Failed to get canvas context'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;

          ctx.drawImage(img, 0, 0);

          ctx.font = `bold ${fontSize}px ${fontFamily}`;
          ctx.fillStyle = `rgba(${color}, ${opacity})`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);

          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((angle * Math.PI) / 180);

          const gridWidth = diagonal * 1.5;
          const gridHeight = diagonal * 1.5;

          for (let y = -gridHeight / 2; y < gridHeight / 2; y += verticalSpacing) {
            for (let x = -gridWidth / 2; x < gridWidth / 2; x += horizontalSpacing) {
              ctx.fillText(text, x, y);
            }
          }

          ctx.restore();

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create watermarked image blob'));
                return;
              }
              resolve(blob);
            },
            'image/jpeg',
            0.85
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for watermarking'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file for watermarking'));
    };

    reader.readAsDataURL(imageFile);
  });
}
