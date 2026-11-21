/**
 * Maximum dimension (width or height) in pixels for compressed photos.
 */
export const MAX_IMAGE_DIMENSION = 1024;

/**
 * JPEG compression quality factor (0.7 balances clarity and file size).
 * Exporting via canvas also strips EXIF and GPS geolocation metadata.
 */
export const JPEG_QUALITY = 0.7;

/**
 * Maximum allowed size in bytes after compression (600 KB).
 */
export const MAX_COMPRESSED_SIZE_BYTES = 600 * 1024;

export interface CompressedImageResult {
  data: string; // Base64 encoded string without data URI prefix
  mimeType: string;
}

/**
 * Compresses an image file in the browser using HTMLCanvasElement.
 * Constrains maximum dimension to 1024px, compresses as JPEG at 0.7 quality,
 * strips EXIF metadata, and rejects if the result exceeds 600 KB.
 *
 * @param {File} file - Raw user image file from file input.
 * @returns {Promise<CompressedImageResult>} Base64 image data and mime type.
 * @throws {Error} If image loading fails or compressed size exceeds 600 KB.
 */
export function compressImage(file: File): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file must be an image.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image.'));
      img.onload = () => {
        let { width, height } = img;

        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
            width = MAX_IMAGE_DIMENSION;
          } else {
            width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
            height = MAX_IMAGE_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context is not available.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // toDataURL with image/jpeg automatically strips EXIF/GPS
        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        const base64Data = dataUrl.split(',')[1] || '';

        // Approximate size in bytes of base64 string
        const sizeInBytes = Math.round((base64Data.length * 3) / 4);

        if (sizeInBytes > MAX_COMPRESSED_SIZE_BYTES) {
          reject(
            new Error(
              `Compressed image (${Math.round(sizeInBytes / 1024)} KB) exceeds the 600 KB limit. Please select a smaller photo.`
            )
          );
          return;
        }

        resolve({
          data: base64Data,
          mimeType: 'image/jpeg',
        });
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
