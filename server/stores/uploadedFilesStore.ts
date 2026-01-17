import type { Database as SqliteDatabase } from "better-sqlite3";
import type { UploadedFile, FilePurpose } from "../types";

/**
 * Retrieves all uploaded files for a project
 */
export const getUploadedFilesByProject = (
  db: SqliteDatabase,
  projectId: string
): UploadedFile[] => {
  const rows = db
    .prepare(
      `SELECT id, project_id, name, size, mime_type, purpose, uri, inline_data, thumbnail, uploaded_at
       FROM uploaded_files
       WHERE project_id = ?
       ORDER BY uploaded_at DESC`
    )
    .all(projectId) as Array<{
    id: string;
    project_id: string;
    name: string;
    size: number;
    mime_type: string;
    purpose: FilePurpose;
    uri?: string | null;
    inline_data?: string | null;
    thumbnail?: string | null;
    uploaded_at: string;
  }>;

  return rows.map((row) => ({
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
  }));
};

/**
 * Retrieves a single uploaded file by ID
 */
export const getUploadedFileById = (
  db: SqliteDatabase,
  fileId: string
): UploadedFile | null => {
  const row = db
    .prepare(
      `SELECT id, project_id, name, size, mime_type, purpose, uri, inline_data, thumbnail, uploaded_at
       FROM uploaded_files
       WHERE id = ?`
    )
    .get(fileId) as
    | {
        id: string;
        project_id: string;
        name: string;
        size: number;
        mime_type: string;
        purpose: FilePurpose;
        uri?: string | null;
        inline_data?: string | null;
        thumbnail?: string | null;
        uploaded_at: string;
      }
    | undefined;

  if (!row) {
    return null;
  }

  return {
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
  };
};

/**
 * Creates a new uploaded file record
 */
export const createUploadedFile = (
  db: SqliteDatabase,
  file: Omit<UploadedFile, "uploadedAt">
): UploadedFile => {
  const now = new Date().toISOString();

  db.prepare<{
    id: string;
    projectId: string;
    name: string;
    size: number;
    mimeType: string;
    purpose: string;
    uri?: string;
    inlineData?: string;
    thumbnail?: string;
    uploadedAt: string;
  }>(
    `INSERT INTO uploaded_files (id, project_id, name, size, mime_type, purpose, uri, inline_data, thumbnail, uploaded_at)
     VALUES (@id, @projectId, @name, @size, @mimeType, @purpose, @uri, @inlineData, @thumbnail, @uploadedAt)`
  ).run({
    id: file.id,
    projectId: file.projectId,
    name: file.name,
    size: file.size,
    mimeType: file.mimeType,
    purpose: file.purpose,
    uri: file.uri,
    inlineData: file.inlineData,
    thumbnail: file.thumbnail,
    uploadedAt: now,
  });

  return {
    ...file,
    uploadedAt: now,
  };
};

/**
 * Updates an uploaded file's purpose
 */
export const updateUploadedFilePurpose = (
  db: SqliteDatabase,
  fileId: string,
  purpose: FilePurpose
): void => {
  db.prepare(`UPDATE uploaded_files SET purpose = ? WHERE id = ?`).run(
    purpose,
    fileId
  );
};

/**
 * Deletes an uploaded file record
 */
export const deleteUploadedFile = (
  db: SqliteDatabase,
  fileId: string
): void => {
  db.prepare(`DELETE FROM uploaded_files WHERE id = ?`).run(fileId);
};

/**
 * Deletes all uploaded files for a project
 * Used when a project is deleted
 */
export const deleteUploadedFilesByProject = (
  db: SqliteDatabase,
  projectId: string
): void => {
  db.prepare(`DELETE FROM uploaded_files WHERE project_id = ?`).run(projectId);
};
