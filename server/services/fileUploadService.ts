import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Database as SqliteDatabase } from "better-sqlite3";
import type { AppConfig } from "../config";
import type { UploadedFile, FilePurpose } from "../types";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import {
  createUploadedFile,
  getUploadedFileById,
  getUploadedFilesByProject,
  updateUploadedFilePurpose,
  deleteUploadedFile,
  deleteUploadedFilesByProject,
} from "../stores/uploadedFilesStore";

const TWENTY_MB = 20 * 1024 * 1024;

const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/mpeg",
];

const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/aac",
  "audio/flac",
];

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
];

/**
 * Determines if a file should be routed through the Gemini Files API
 * based on size and type
 */
const shouldUseFilesApi = (
  size: number,
  mimeType: string,
  filesApiEnabled: boolean
): boolean => {
  if (!filesApiEnabled) {
    return false;
  }

  // Files > 20MB must use Files API
  if (size > TWENTY_MB) {
    return true;
  }

  // Video and audio files should use Files API regardless of size
  if (
    VIDEO_MIME_TYPES.includes(mimeType) ||
    AUDIO_MIME_TYPES.includes(mimeType)
  ) {
    return true;
  }

  return false;
};

/**
 * Uploads a file to the Gemini Files API
 */
const uploadToFilesApi = async (
  filePath: string,
  mimeType: string,
  displayName: string
): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw Object.assign(
      new Error("Gemini API key not configured for Files API upload"),
      {
        statusCode: 503,
        errorCode: "GEMINI_API_KEY_MISSING",
        retryable: false,
      }
    );
  }

  try {
    const client = new GoogleGenAI({ apiKey });

    // Upload file using the Files API
    const uploadResult = await client.files.upload({
      file: filePath,
      config: {
        mimeType,
        displayName,
      },
    });

    if (!uploadResult?.uri) {
      throw new Error("Files API did not return a URI");
    }

    return uploadResult.uri;
  } catch (error) {
    throw Object.assign(
      new Error(
        `Failed to upload file to Gemini Files API: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      ),
      {
        statusCode: 500,
        errorCode: "FILES_API_UPLOAD_FAILED",
        retryable: true,
      }
    );
  }
};

/**
 * Encodes a file as base64 for inline data
 */
const encodeFileAsBase64 = (filePath: string): string => {
  const buffer = fs.readFileSync(filePath);
  return buffer.toString("base64");
};

/**
 * Generates a thumbnail for an image file
 */
const generateImageThumbnail = async (
  filePath: string
): Promise<string | undefined> => {
  try {
    const buffer = await sharp(filePath)
      .resize(200, 200, {
        fit: "cover",
        position: "center",
      })
      .png()
      .toBuffer();

    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.error("Failed to generate thumbnail:", error);
    return undefined;
  }
};

/**
 * Generates a thumbnail for a file based on its type
 */
const generateThumbnail = async (
  filePath: string,
  mimeType: string
): Promise<string | undefined> => {
  if (IMAGE_MIME_TYPES.includes(mimeType)) {
    return generateImageThumbnail(filePath);
  }

  // For video and other types, we could implement video frame extraction
  // or use placeholder thumbnails in the future
  return undefined;
};

/**
 * Sanitizes a filename to prevent path traversal and other security issues
 */
const sanitizeFileName = (fileName: string): string => {
  const base = path.basename(fileName);
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 128);
  return cleaned.length > 0 ? cleaned : `file-${Date.now()}`;
};

/**
 * Persists a file to the project directory structure
 * Files are stored under data/assets/<projectId>/uploads/
 */
const persistFileToStorage = (
  config: AppConfig,
  projectId: string,
  sourcePath: string,
  fileName: string
): string => {
  const uploadsDir = path.join(config.dataDir, "assets", projectId, "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });

  const targetPath = path.join(uploadsDir, fileName);

  // Copy file to persistent storage
  fs.copyFileSync(sourcePath, targetPath);

  return targetPath;
};

export interface UploadFileOptions {
  db: SqliteDatabase;
  config: AppConfig;
  projectId: string;
  purpose: FilePurpose;
  file: {
    path: string;
    originalname: string;
    size: number;
    mimetype: string;
  };
}

/**
 * Uploads a file with size-based routing logic
 * - Files > 20MB → Gemini Files API
 * - Files < 20MB → Base64 inline data
 * - Video/audio files → Gemini Files API (regardless of size)
 */
export const uploadFile = async (
  options: UploadFileOptions
): Promise<UploadedFile> => {
  const { db, config, projectId, purpose, file } = options;

  // Validate file size
  const maxSizeBytes = config.maxFileSizeMb * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw Object.assign(
      new Error(
        `File size exceeds maximum allowed size of ${config.maxFileSizeMb}MB`
      ),
      {
        statusCode: 413,
        errorCode: "FILE_TOO_LARGE",
        retryable: false,
      }
    );
  }

  const sanitizedName = sanitizeFileName(file.originalname);
  const useFilesApi = shouldUseFilesApi(
    file.size,
    file.mimetype,
    config.filesApiEnabled
  );

  let uri: string | undefined;
  let inlineData: string | undefined;

  if (useFilesApi) {
    // Route through Gemini Files API
    uri = await uploadToFilesApi(file.path, file.mimetype, sanitizedName);
  } else {
    // Encode as base64 inline data
    inlineData = encodeFileAsBase64(file.path);
  }

  // Persist file to project directory structure
  const persistedPath = persistFileToStorage(
    config,
    projectId,
    file.path,
    sanitizedName
  );

  // Generate thumbnail
  const thumbnail = await generateThumbnail(persistedPath, file.mimetype);

  // Store file metadata in database
  const uploadedFile = createUploadedFile(db, {
    id: randomUUID(),
    projectId,
    name: sanitizedName,
    size: file.size,
    mimeType: file.mimetype,
    purpose,
    uri,
    inlineData,
    thumbnail,
  });

  return uploadedFile;
};

/**
 * Retrieves all uploaded files for a project
 */
export const getProjectFiles = (
  db: SqliteDatabase,
  projectId: string
): UploadedFile[] => {
  return getUploadedFilesByProject(db, projectId);
};

/**
 * Retrieves a single uploaded file by ID
 */
export const getFileById = (
  db: SqliteDatabase,
  fileId: string
): UploadedFile | null => {
  return getUploadedFileById(db, fileId);
};

/**
 * Validates that a file purpose is valid
 */
export const validateFilePurpose = (
  purpose: string
): purpose is FilePurpose => {
  const validPurposes: FilePurpose[] = [
    "style-reference",
    "character-reference",
    "audio-reference",
    "text-document",
    "general-reference",
  ];
  return validPurposes.includes(purpose as FilePurpose);
};

/**
 * Verifies that a user owns a project (for authorization checks)
 */
export const verifyProjectOwnership = (
  db: SqliteDatabase,
  projectId: string
): boolean => {
  const row = db
    .prepare(`SELECT id FROM projects WHERE id = ?`)
    .get(projectId) as { id: string } | undefined;

  return row !== undefined;
};

/**
 * Deletes a file from the Gemini Files API
 */
const deleteFromFilesApi = async (uri: string): Promise<void> => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.warn("Cannot delete from Files API: Gemini API key not configured");
    return;
  }

  try {
    const client = new GoogleGenAI({ apiKey });

    // Extract file name from URI (format: files/file-id)
    const fileName = uri.startsWith("files/") ? uri : `files/${uri}`;

    // Delete file using the Files API
    await client.files.delete({ name: fileName });
  } catch (error) {
    console.error("Failed to delete file from Files API:", error);
    // Don't throw - we still want to delete the database record
  }
};

/**
 * Deletes an uploaded file and cleans up Files API resources
 */
export const deleteFile = async (
  db: SqliteDatabase,
  fileId: string,
  projectId: string
): Promise<void> => {
  // Verify project ownership
  if (!verifyProjectOwnership(db, projectId)) {
    throw Object.assign(new Error("Project not found"), {
      statusCode: 404,
      errorCode: "PROJECT_NOT_FOUND",
      retryable: false,
    });
  }

  // Get file details
  const file = getFileById(db, fileId);
  if (!file) {
    throw Object.assign(new Error("File not found"), {
      statusCode: 404,
      errorCode: "FILE_NOT_FOUND",
      retryable: false,
    });
  }

  // Verify file belongs to project
  if (file.projectId !== projectId) {
    throw Object.assign(new Error("File does not belong to this project"), {
      statusCode: 403,
      errorCode: "FILE_PROJECT_MISMATCH",
      retryable: false,
    });
  }

  // Clean up Files API resource if applicable
  if (file.uri) {
    await deleteFromFilesApi(file.uri);
  }

  // Delete from database
  deleteUploadedFile(db, fileId);
};

/**
 * Updates file metadata (e.g., purpose)
 */
export const updateFilePurpose = (
  db: SqliteDatabase,
  fileId: string,
  projectId: string,
  purpose: FilePurpose
): UploadedFile => {
  // Verify project ownership
  if (!verifyProjectOwnership(db, projectId)) {
    throw Object.assign(new Error("Project not found"), {
      statusCode: 404,
      errorCode: "PROJECT_NOT_FOUND",
      retryable: false,
    });
  }

  // Get file details
  const file = getFileById(db, fileId);
  if (!file) {
    throw Object.assign(new Error("File not found"), {
      statusCode: 404,
      errorCode: "FILE_NOT_FOUND",
      retryable: false,
    });
  }

  // Verify file belongs to project
  if (file.projectId !== projectId) {
    throw Object.assign(new Error("File does not belong to this project"), {
      statusCode: 403,
      errorCode: "FILE_PROJECT_MISMATCH",
      retryable: false,
    });
  }

  // Update purpose
  updateUploadedFilePurpose(db, fileId, purpose);

  // Return updated file
  const updatedFile = getFileById(db, fileId);
  if (!updatedFile) {
    throw new Error("Failed to retrieve updated file");
  }

  return updatedFile;
};

/**
 * Cleans up all files associated with a project
 * Called when a project is deleted
 */
export const cleanupProjectFiles = async (
  db: SqliteDatabase,
  config: AppConfig,
  projectId: string
): Promise<void> => {
  // Get all files for the project
  const files = getProjectFiles(db, projectId);

  // Clean up Files API resources
  for (const file of files) {
    if (file.uri) {
      await deleteFromFilesApi(file.uri);
    }
  }

  // Delete file records from database
  deleteUploadedFilesByProject(db, projectId);

  // Delete physical files from storage
  const uploadsDir = path.join(config.dataDir, "assets", projectId, "uploads");
  if (fs.existsSync(uploadsDir)) {
    try {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to delete uploads directory: ${uploadsDir}`, error);
    }
  }
};
