/**
 * File Upload Utility
 *
 * Provides multipart upload helpers with progress tracking and cancellation.
 * Includes client-side thumbnail generation for images.
 *
 * Requirements: 10.5, 10.8
 */

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  file: File;
  url: string;
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (response: any) => void;
  onError?: (error: Error) => void;
  additionalData?: Record<string, string>;
}

export interface UploadController {
  cancel: () => void;
  promise: Promise<any>;
}

/**
 * Uploads a file with progress tracking and cancellation support
 */
export function uploadFile(options: UploadOptions): UploadController {
  const { file, url, onProgress, onComplete, onError, additionalData } =
    options;

  const xhr = new XMLHttpRequest();
  const formData = new FormData();

  formData.append("file", file);

  // Add additional data fields
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  // Track upload progress
  if (onProgress) {
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const progress: UploadProgress = {
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        };
        onProgress(progress);
      }
    });
  }

  const promise = new Promise((resolve, reject) => {
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          onComplete?.(response);
          resolve(response);
        } catch (error) {
          const parseError = new Error("Failed to parse upload response");
          onError?.(parseError);
          reject(parseError);
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          const error = new Error(errorResponse.error || "Upload failed");
          Object.assign(error, {
            status: xhr.status,
            requestId: errorResponse.requestId,
            retryable: errorResponse.retryable,
            errorCode: errorResponse.errorCode,
          });
          onError?.(error);
          reject(error);
        } catch {
          const error = new Error(`Upload failed with status ${xhr.status}`);
          onError?.(error);
          reject(error);
        }
      }
    });

    xhr.addEventListener("error", () => {
      const error = new Error("Network error during upload");
      onError?.(error);
      reject(error);
    });

    xhr.addEventListener("abort", () => {
      const error = new Error("Upload cancelled");
      onError?.(error);
      reject(error);
    });

    xhr.open("POST", url);
    xhr.send(formData);
  });

  return {
    cancel: () => xhr.abort(),
    promise,
  };
}

/**
 * Generates a thumbnail for an image file
 */
export async function generateThumbnail(
  file: File,
  maxWidth: number = 200,
  maxHeight: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("File is not an image"));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        // Calculate thumbnail dimensions
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Create canvas and draw thumbnail
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to data URL
        const thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.8);
        resolve(thumbnailDataUrl);
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validates file size and type
 */
export function validateFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSizeMB = 100, allowedTypes } = options;

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `File size (${fileSizeMB.toFixed(
        2
      )}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
    };
  }

  // Check file type
  if (allowedTypes && allowedTypes.length > 0) {
    const isAllowed = allowedTypes.some((type) => {
      if (type.endsWith("/*")) {
        const category = type.split("/")[0];
        return file.type.startsWith(`${category}/`);
      }
      return file.type === type;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `File type ${
          file.type
        } is not supported. Allowed types: ${allowedTypes.join(", ")}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Batch upload multiple files with progress tracking
 */
export async function uploadFiles(
  files: File[],
  url: string,
  options: {
    onProgress?: (fileIndex: number, progress: UploadProgress) => void;
    onFileComplete?: (fileIndex: number, response: any) => void;
    onError?: (fileIndex: number, error: Error) => void;
    additionalData?: Record<string, string>;
  } = {}
): Promise<any[]> {
  const { onProgress, onFileComplete, onError, additionalData } = options;

  const results: any[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const controller = uploadFile({
        file: files[i],
        url,
        onProgress: (progress) => onProgress?.(i, progress),
        additionalData,
      });

      const result = await controller.promise;
      results.push(result);
      onFileComplete?.(i, result);
    } catch (error) {
      onError?.(i, error as Error);
      throw error; // Stop on first error
    }
  }

  return results;
}
