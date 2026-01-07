import { useCallback, useState } from "react";

export interface ImageAttachment {
  data: string;
  mimeType: string;
  preview: string;
}

export interface ImageAttachmentOptions {
  maxSizeBytes?: number; // default 5MB
  allowedMimeTypes?: string[]; // default common image types
}

const readFileToDataUrl = (file: File): Promise<ImageAttachment> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unsupported file reader result"));
        return;
      }
      const [meta, base64] = result.split(",", 2);
      const mimeType = meta.match(/data:(.*?);/)?.[1] || file.type;
      resolve({ data: base64 ?? "", mimeType, preview: result });
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Unable to read file"));
    };
    reader.readAsDataURL(file);
  });
};

export const useImageAttachment = (options?: ImageAttachmentOptions) => {
  const [attachment, setAttachment] = useState<ImageAttachment | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxSizeBytes = options?.maxSizeBytes ?? 5 * 1024 * 1024; // 5MB
  const allowedMimeTypes = options?.allowedMimeTypes ?? [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  const clearAttachment = useCallback(() => {
    setAttachment(null);
    setError(null);
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | null | undefined) => {
      if (!files || files.length === 0) {
        return;
      }
      const file = files[0];
      // validate before reading
      if (file.size > maxSizeBytes) {
        setError(
          `Image is too large. Max size is ${Math.round(
            maxSizeBytes / (1024 * 1024)
          )}MB.`
        );
        return;
      }
      if (
        allowedMimeTypes.length > 0 &&
        !allowedMimeTypes.includes(file.type)
      ) {
        setError("Unsupported file type. Please upload a JPEG, PNG, or WebP.");
        return;
      }
      setError(null);
      setIsReading(true);
      try {
        const parsed = await readFileToDataUrl(file);
        setAttachment(parsed);
      } finally {
        setIsReading(false);
      }
    },
    [allowedMimeTypes, maxSizeBytes]
  );

  return {
    attachment,
    isReading,
    error,
    handleFiles,
    clearAttachment,
  };
};
