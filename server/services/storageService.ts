/**
 * Storage Service Interface
 *
 * Defines the contract for file storage implementations.
 * This allows switching between local filesystem and cloud storage (Vercel Blob)
 * based on the runtime environment.
 */

export interface StorageResult {
    /** The stored path/key for the file */
    storedPath: string;
    /** Public URL to access the file (for cloud storage) or relative path (for local) */
    publicUrl: string;
    /** Size of the stored file in bytes */
    size: number;
}

export interface StorageService {
    /**
     * Persist a file to storage
     * @param projectId - The project this file belongs to
     * @param sourcePath - The local path to the source file
     * @param fileName - The sanitized file name to use
     * @returns Promise resolving to storage result with path and URL
     */
    persistFile(
        projectId: string,
        sourcePath: string,
        fileName: string
    ): Promise<StorageResult>;

    /**
     * Delete a file from storage
     * @param storedPath - The stored path/key of the file
     */
    deleteFile(storedPath: string): Promise<void>;

    /**
     * Get the public URL for a stored file
     * @param storedPath - The stored path/key of the file
     * @returns The public URL to access the file
     */
    getPublicUrl(storedPath: string): string;

    /**
     * Delete all files for a project
     * @param projectId - The project ID whose files should be deleted
     */
    deleteProjectFiles(projectId: string): Promise<void>;
}

// Factory function to get the appropriate storage service
// Import is deferred to avoid circular dependencies and allow conditional loading
import { isVercel } from "../utils/environment";

let storageServiceInstance: StorageService | null = null;

/**
 * Get the singleton storage service instance
 * Returns LocalStorageService for local development, VercelBlobStorageService for Vercel
 */
export const getStorageService = async (): Promise<StorageService> => {
    if (storageServiceInstance) {
        return storageServiceInstance;
    }

    if (isVercel()) {
        const { VercelBlobStorageService } = await import("./vercelBlobStorage");
        storageServiceInstance = new VercelBlobStorageService();
    } else {
        const { LocalStorageService } = await import("./localStorage");
        storageServiceInstance = new LocalStorageService();
    }

    return storageServiceInstance;
};

/**
 * Synchronous getter for testing or when you know the service is initialized
 * Will throw if called before initialization
 */
export const getStorageServiceSync = (): StorageService => {
    if (!storageServiceInstance) {
        throw new Error(
            "Storage service not initialized. Call getStorageService() first."
        );
    }
    return storageServiceInstance;
};

/**
 * Initialize the storage service (should be called during app startup)
 */
export const initializeStorageService = async (): Promise<void> => {
    await getStorageService();
};
