import React, { useState, useRef, useCallback } from "react";
import { Upload, X, AlertCircle } from "lucide-react";
import { Loader } from "@/components/Loader";
import { useGenerationStore } from "../../generation/state";
import type {
  FilePurpose,
  UploadedFile,
} from "../../../types/gemini-enhancement";

interface UploadDropzoneProps {
  projectId: string;
  maxFiles?: number;
  onFilesUploaded: (files: UploadedFile[]) => void;
  onError: (error: string) => void;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "text/plain",
  "application/pdf",
];

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  projectId,
  maxFiles = 10,
  onFilesUploaded,
  onError,
}) => {
  const uploadFile = useGenerationStore((state) => state.uploadFile);
  const uploadProgress = useGenerationStore((state) => state.uploadProgress);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" is too large. Maximum size is 100MB.`;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `File "${file.name}" has unsupported format. Supported: images, videos, audio, text, PDF.`;
    }

    return null;
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;

    if (files.length > maxFiles) {
      onError(`Maximum ${maxFiles} files allowed per upload.`);
      return;
    }

    // Validate all files first
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        onError(error);
        return;
      }
    }

    setIsUploading(true);
    const uploadedFiles: UploadedFile[] = [];

    try {
      for (const file of files) {
        const uploadedFile = await uploadFile(
          projectId,
          file,
          "general-reference" as FilePurpose,
          (progress) => {
            // Progress is tracked in the store
          }
        );
        uploadedFiles.push(uploadedFile);
      }

      onFilesUploaded(uploadedFiles);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      onError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;

      const files = Array.from(e.dataTransfer.files);
      void uploadFiles(files);
    },
    [projectId, maxFiles]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    void uploadFiles(files);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (isUploading) {
    const progressArray = Array.from(uploadProgress.values());
    return (
      <div className="placeholder-dashed p-6">
        <div className="space-y-3">
          {progressArray.map((progress, idx) => {
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted truncate flex-1">
                    {progress.fileName}
                  </span>
                  <span className="text-muted ml-2">
                    {Math.round(progress.progress)}%
                  </span>
                </div>
                <div className="w-full bg-muted/30 rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={
                      { width: `${progress.progress}%` } as React.CSSProperties
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const tooltipText = `Images, videos, audio, text, PDF • Max ${maxFiles} files • Up to 100MB each`;

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      title={tooltipText}
      className={`placeholder-dashed px-4 py-2 cursor-pointer ${isDragging ? "border-primary bg-primary/5" : ""
        }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="File upload input"
      />

      {/* Compact horizontal layout (Task 2.2) - left aligned */}
      <div className="flex items-center gap-2">
        <Upload
          className={`w-5 h-5 flex-shrink-0 ${isDragging ? "text-primary" : "text-muted"
            }`}
        />
        <span className="text-sm font-medium">
          {isDragging ? "Drop files here" : "Upload files"}
        </span>
      </div>
    </div>
  );
};
