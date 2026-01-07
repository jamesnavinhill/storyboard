import { useCallback, useState } from "react";
import type { FilePurpose } from "../../chat/components/FilePurposeSelector";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  purpose: FilePurpose;
  uri?: string;
  inlineData?: string;
  thumbnail?: string;
}

export interface FileContext {
  files: UploadedFile[];
  purpose: FilePurpose;
}

export interface UseFileUploadIntegrationOptions {
  maxFiles?: number;
}

export const useFileUploadIntegration = (
  options: UseFileUploadIntegrationOptions = {}
) => {
  const { maxFiles = 10 } = options;
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const addFiles = useCallback(
    (files: UploadedFile[]) => {
      setUploadedFiles((prev) => {
        const combined = [...prev, ...files];
        // Limit to maxFiles
        return combined.slice(0, maxFiles);
      });
    },
    [maxFiles]
  );

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const updateFilePurpose = useCallback(
    (fileId: string, purpose: FilePurpose) => {
      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, purpose } : f))
      );
    },
    []
  );

  const reorderFiles = useCallback((fileIds: string[]) => {
    setUploadedFiles((prev) => {
      const fileMap = new Map(prev.map((f) => [f.id, f]));
      return fileIds.map((id) => fileMap.get(id)!).filter(Boolean);
    });
  }, []);

  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  const prepareFilesForGeneration = useCallback((): FileContext[] => {
    return uploadedFiles.map((file) => ({
      files: [file],
      purpose: file.purpose,
    }));
  }, [uploadedFiles]);

  const getFilesPayload = useCallback(() => {
    return uploadedFiles.map((file) => ({
      id: file.id,
      purpose: file.purpose,
      uri: file.uri,
      inlineData: file.inlineData,
      mimeType: file.mimeType,
    }));
  }, [uploadedFiles]);

  return {
    uploadedFiles,
    addFiles,
    removeFile,
    updateFilePurpose,
    reorderFiles,
    clearFiles,
    prepareFilesForGeneration,
    getFilesPayload,
    hasFiles: uploadedFiles.length > 0,
    fileCount: uploadedFiles.length,
    canAddMore: uploadedFiles.length < maxFiles,
  };
};
