/**
 * Async Uploaded Files Store
 *
 * Provides async database operations for uploaded files.
 */

import type { UnifiedDatabase, DatabaseRow } from "../database";
import type { UploadedFile, FilePurpose } from "../types";

interface UploadedFileRow extends DatabaseRow {
  id: string;
  project_id: string;
  name: string;
  size: number;
  mime_type: string;
  purpose: FilePurpose;
  uri: string | null;
  inline_data: string | null;
  thumbnail: string | null;
  uploaded_at: string;
}

const mapUploadedFileRow = (row: UploadedFileRow): UploadedFile => ({
  id: row.id,
  projectId: row.project_id,
  name: row.name,
  size: row.size,
  mimeType: row.mime_type,
  purpose: row.purpose,
  uri: row.uri ?? undefined,
  inlineData: row.inline_data ?? undefined,
  thumbnail: row.thumbnail ?? undefined,
  uploadedAt: row.uploaded_at,
});

/**
 * Retrieves all uploaded files for a project
 */
export const getUploadedFilesByProject = async (
  db: UnifiedDatabase,
  projectId: string
): Promise<UploadedFile[]> => {
  const result = await db.query<UploadedFileRow>(
    `SELECT id, project_id, name, size, mime_type, purpose, uri, inline_data, thumbnail, uploaded_at
     FROM uploaded_files
     WHERE project_id = ?
     ORDER BY uploaded_at DESC`,
    [projectId]
  );

  return result.rows.map(mapUploadedFileRow);
};

/**
 * Retrieves a single uploaded file by ID
 */
export const getUploadedFileById = async (
  db: UnifiedDatabase,
  fileId: string
): Promise<UploadedFile | null> => {
  const row = await db.queryOne<UploadedFileRow>(
    `SELECT id, project_id, name, size, mime_type, purpose, uri, inline_data, thumbnail, uploaded_at
     FROM uploaded_files
     WHERE id = ?`,
    [fileId]
  );

  return row ? mapUploadedFileRow(row) : null;
};

/**
 * Creates a new uploaded file record
 */
export const createUploadedFile = async (
  db: UnifiedDatabase,
  file: Omit<UploadedFile, "uploadedAt">
): Promise<UploadedFile> => {
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO uploaded_files (id, project_id, name, size, mime_type, purpose, uri, inline_data, thumbnail, uploaded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      file.id,
      file.projectId,
      file.name,
      file.size,
      file.mimeType,
      file.purpose,
      file.uri ?? null,
      file.inlineData ?? null,
      file.thumbnail ?? null,
      now,
    ]
  );

  return {
    ...file,
    uploadedAt: now,
  };
};

/**
 * Updates an uploaded file's purpose
 */
export const updateUploadedFilePurpose = async (
  db: UnifiedDatabase,
  fileId: string,
  purpose: FilePurpose
): Promise<void> => {
  await db.execute(`UPDATE uploaded_files SET purpose = ? WHERE id = ?`, [
    purpose,
    fileId,
  ]);
};

/**
 * Deletes an uploaded file record
 */
export const deleteUploadedFile = async (
  db: UnifiedDatabase,
  fileId: string
): Promise<void> => {
  await db.execute(`DELETE FROM uploaded_files WHERE id = ?`, [fileId]);
};

/**
 * Deletes all uploaded files for a project
 * Used when a project is deleted
 */
export const deleteUploadedFilesByProject = async (
  db: UnifiedDatabase,
  projectId: string
): Promise<void> => {
  await db.execute(`DELETE FROM uploaded_files WHERE project_id = ?`, [
    projectId,
  ]);
};
