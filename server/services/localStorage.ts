/**
 * Local Storage Service
 *
 * Implements StorageService interface for local filesystem storage.
 * Used during local development.
 * Files are stored under data/assets/<projectId>/uploads/
 */

import fs from "node:fs";
import path from "node:path";
import type { StorageService, StorageResult } from "./storageService";
import { getConfig } from "../config";

export class LocalStorageService implements StorageService {
    private readonly dataDir: string;

    constructor() {
        const config = getConfig();
        this.dataDir = config.dataDir;
    }

    /**
     * Get the uploads directory for a project
     */
    private getUploadsDir(projectId: string): string {
        return path.join(this.dataDir, "assets", projectId, "uploads");
    }

    /**
     * Persist a file to local storage
     */
    async persistFile(
        projectId: string,
        sourcePath: string,
        fileName: string
    ): Promise<StorageResult> {
        const uploadsDir = this.getUploadsDir(projectId);
        fs.mkdirSync(uploadsDir, { recursive: true });

        const targetPath = path.join(uploadsDir, fileName);

        // Copy file to persistent storage
        fs.copyFileSync(sourcePath, targetPath);

        // Get file stats for size
        const stats = fs.statSync(targetPath);

        return {
            storedPath: targetPath,
            publicUrl: `/api/assets/${projectId}/uploads/${fileName}`,
            size: stats.size,
        };
    }

    /**
     * Delete a file from local storage
     */
    async deleteFile(storedPath: string): Promise<void> {
        if (fs.existsSync(storedPath)) {
            try {
                fs.unlinkSync(storedPath);
            } catch (error) {
                console.error(`Failed to delete file: ${storedPath}`, error);
                // Don't throw - log and continue
            }
        }
    }

    /**
     * Get the public URL for a stored file
     * For local storage, this returns a relative path served by the API
     */
    getPublicUrl(storedPath: string): string {
        // Extract project ID and filename from the stored path
        // Path format: .../data/assets/<projectId>/uploads/<filename>
        const parts = storedPath.split(path.sep);
        const uploadsIndex = parts.indexOf("uploads");

        if (uploadsIndex === -1 || uploadsIndex < 2) {
            // Fallback: return the path as-is
            return storedPath;
        }

        const projectId = parts[uploadsIndex - 1];
        const fileName = parts.slice(uploadsIndex + 1).join("/");

        return `/api/assets/${projectId}/uploads/${fileName}`;
    }

    /**
     * Delete all files for a project
     */
    async deleteProjectFiles(projectId: string): Promise<void> {
        const uploadsDir = this.getUploadsDir(projectId);

        if (fs.existsSync(uploadsDir)) {
            try {
                fs.rmSync(uploadsDir, { recursive: true, force: true });
            } catch (error) {
                console.error(`Failed to delete uploads directory: ${uploadsDir}`, error);
                // Don't throw - log and continue
            }
        }
    }
}
