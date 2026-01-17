import type { StateCreator } from "zustand";
import type {
  UploadedFile,
  UploadProgress,
  FilePurpose,
} from "../../../types/gemini-enhancement";

// File upload slice state interface
export interface FileUploadSlice {
  uploadedFiles: UploadedFile[];
  uploadProgress: Map<string, UploadProgress>;
  isFilesLoading: boolean;

  // File upload operations
  uploadFile: (
    projectId: string,
    file: File,
    purpose: FilePurpose,
    onProgress?: (progress: number) => void
  ) => Promise<UploadedFile>;

  // File management
  fetchProjectFiles: (projectId: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  updateFilePurpose: (fileId: string, purpose: FilePurpose) => Promise<void>;
  reorderFiles: (fileIds: string[]) => void;

  // Upload progress tracking
  setUploadProgress: (fileId: string, progress: UploadProgress) => void;
  clearUploadProgress: (fileId: string) => void;
  clearAllUploadProgress: () => void;

  // Clear state
  clearFiles: () => void;
}

export const createFileUploadSlice: StateCreator<
  FileUploadSlice,
  [],
  [],
  FileUploadSlice
> = (set, get) => ({
  uploadedFiles: [],
  uploadProgress: new Map(),
  isFilesLoading: false,

  uploadFile: async (projectId, file, purpose, onProgress) => {
    const tempFileId = `temp-${Date.now()}-${Math.random()}`;

    // Initialize progress tracking
    set((state) => {
      const newProgress = new Map(state.uploadProgress);
      newProgress.set(tempFileId, {
        fileId: tempFileId,
        fileName: file.name,
        progress: 0,
        status: "uploading",
      });
      return { uploadProgress: newProgress };
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);
      formData.append("purpose", purpose);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);

          set((state) => {
            const newProgress = new Map(state.uploadProgress);
            const current = newProgress.get(tempFileId);
            if (current) {
              newProgress.set(tempFileId, {
                ...current,
                progress,
              });
            }
            return { uploadProgress: newProgress };
          });

          onProgress?.(progress);
        }
      });

      // Create promise for XHR
      const uploadPromise = new Promise<UploadedFile>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              const uploadedFile: UploadedFile = data.file;
              resolve(uploadedFile);
            } catch (error) {
              reject(new Error("Failed to parse response"));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed: Network error"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload cancelled"));
        });
      });

      xhr.open("POST", "/api/files/upload");
      xhr.send(formData);

      const uploadedFile = await uploadPromise;

      // Update progress to complete
      set((state) => {
        const newProgress = new Map(state.uploadProgress);
        newProgress.set(tempFileId, {
          fileId: uploadedFile.id,
          fileName: file.name,
          progress: 100,
          status: "complete",
        });
        return {
          uploadProgress: newProgress,
          uploadedFiles: [...state.uploadedFiles, uploadedFile],
        };
      });

      // Clear progress after a delay
      setTimeout(() => {
        get().clearUploadProgress(tempFileId);
      }, 2000);

      return uploadedFile;
    } catch (error) {
      // Update progress to error
      set((state) => {
        const newProgress = new Map(state.uploadProgress);
        const current = newProgress.get(tempFileId);
        if (current) {
          newProgress.set(tempFileId, {
            ...current,
            status: "error",
            error: error instanceof Error ? error.message : "Upload failed",
          });
        }
        return { uploadProgress: newProgress };
      });

      console.error("Failed to upload file:", error);
      throw error;
    }
  },

  fetchProjectFiles: async (projectId) => {
    set({ isFilesLoading: true });
    try {
      const response = await fetch(`/api/files?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }
      const data = await response.json();
      const files: UploadedFile[] = data.files || [];

      set({
        uploadedFiles: files,
        isFilesLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch files:", error);
      set({ isFilesLoading: false });
      throw error;
    }
  },

  deleteFile: async (fileId) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }

      set((state) => ({
        uploadedFiles: state.uploadedFiles.filter((f) => f.id !== fileId),
      }));
    } catch (error) {
      console.error("Failed to delete file:", error);
      throw error;
    }
  },

  updateFilePurpose: async (fileId, purpose) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update file purpose: ${response.statusText}`
        );
      }

      const data = await response.json();
      const updatedFile: UploadedFile = data.file;

      set((state) => ({
        uploadedFiles: state.uploadedFiles.map((f) =>
          f.id === fileId ? updatedFile : f
        ),
      }));
    } catch (error) {
      console.error("Failed to update file purpose:", error);
      throw error;
    }
  },

  reorderFiles: (fileIds) => {
    set((state) => {
      const fileMap = new Map(state.uploadedFiles.map((f) => [f.id, f]));
      const reordered = fileIds
        .map((id) => fileMap.get(id))
        .filter((f): f is UploadedFile => f !== undefined);

      return { uploadedFiles: reordered };
    });
  },

  setUploadProgress: (fileId, progress) => {
    set((state) => {
      const newProgress = new Map(state.uploadProgress);
      newProgress.set(fileId, progress);
      return { uploadProgress: newProgress };
    });
  },

  clearUploadProgress: (fileId) => {
    set((state) => {
      const newProgress = new Map(state.uploadProgress);
      newProgress.delete(fileId);
      return { uploadProgress: newProgress };
    });
  },

  clearAllUploadProgress: () => {
    set({ uploadProgress: new Map() });
  },

  clearFiles: () => {
    set({
      uploadedFiles: [],
      uploadProgress: new Map(),
    });
  },
});
