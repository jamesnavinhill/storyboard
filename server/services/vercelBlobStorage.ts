/**
 * Vercel Blob Storage Service
 *
 * Implements StorageService interface for Vercel Blob storage.
 * Used when deployed to Vercel.
 * Requires BLOB_READ_WRITE_TOKEN environment variable.
 */

import fs from "node:fs";
import { put, del, list } from "@vercel/blob";
import type { StorageService, StorageResult } from "./storageService";

export class VercelBlobStorageService implements StorageService {
    /**
     * Get the blob path prefix for a project
     */
    private getBlobPath(projectId: string, fileName: string): string {
        return `assets/${projectId}/uploads/${fileName}`;
    }

    /**
     * Persist a file to Vercel Blob storage
     */
    async persistFile(
        projectId: string,
        sourcePath: string,
        fileName: string
    ): Promise<StorageResult> {
        // Read file from disk
        const fileBuffer = fs.readFileSync(sourcePath);
        const blobPath = this.getBlobPath(projectId, fileName);

        // Upload to Vercel Blob
        const blob = await put(blobPath, fileBuffer, {
            access: "public",
            addRandomSuffix: false, // Use exact path for consistency
        });

        return {
            storedPath: blob.pathname,
            publicUrl: blob.url,
            size: fileBuffer.length,
        };
    }

    /**
     * Delete a file from Vercel Blob storage
     */
    async deleteFile(storedPath: string): Promise<void> {
        try {
            // The storedPath may be the pathname or full URL
            // del() accepts both formats
            await del(storedPath);
        } catch (error) {
            console.error(`Failed to delete blob: ${storedPath}`, error);
            // Don't throw - log and continue
        }
    }

    /**
     * Get the public URL for a stored file
     * For Vercel Blob, the storedPath should already be the URL or can be constructed
     */
    getPublicUrl(storedPath: string): string {
        // If it's already a full URL, return it
        if (storedPath.startsWith("http://") || storedPath.startsWith("https://")) {
            return storedPath;
        }

        // Otherwise, this might be just the pathname - we need to handle this case
        // In practice, we should always store the full URL from the upload response
        console.warn(
            "VercelBlobStorageService.getPublicUrl called with non-URL path. " +
            "This may indicate the storedPath was not set correctly during upload."
        );
        return storedPath;
    }

    /**
     * Delete all files for a project
     */
    async deleteProjectFiles(projectId: string): Promise<void> {
        try {
            const prefix = `assets/${projectId}/`;

            // List all blobs with this prefix
            const { blobs } = await list({ prefix });

            // Delete each blob
            for (const blob of blobs) {
                await this.deleteFile(blob.url);
            }
        } catch (error) {
            console.error(`Failed to delete project files for: ${projectId}`, error);
            // Don't throw - log and continue
        }
    }
}
