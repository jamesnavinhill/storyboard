import { randomUUID } from "node:crypto";
import type { Database as SqliteDatabase } from "better-sqlite3";

export interface DocumentContent {
  title: string;
  style: string;
  goals: string[];
  outline: string;
  scenes: DocumentScene[];
  chatHistory?: DocumentChatMessage[];
  metadata: {
    workflow: string;
    systemInstruction: string;
    modelSettings: Record<string, unknown>;
    totalDuration: number;
  };
}

export interface DocumentScene {
  id: string;
  order: number;
  title: string;
  description: string;
  imagePrompt: string;
  animationPrompt: string;
  metadata: Record<string, unknown>;
  generatedAssets?: string[];
}

export interface DocumentChatMessage {
  timestamp: string;
  role: "user" | "model";
  content: string;
  addedToDocument: boolean;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  version: number;
  content: DocumentContent;
  createdAt: string;
  updatedAt: string;
}

const MAX_VERSIONS = 10;

/**
 * Get the latest document for a project
 */
export const getDocument = (
  db: SqliteDatabase,
  projectId: string
): ProjectDocument | null => {
  const row = db
    .prepare(
      `SELECT id, project_id, version, content, created_at, updated_at
       FROM project_documents
       WHERE project_id = ?
       ORDER BY version DESC
       LIMIT 1`
    )
    .get(projectId) as
    | {
        id: string;
        project_id: string;
        version: number;
        content: string;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  if (!row) {
    return null;
  }

  return mapDocumentRow(row);
};

/**
 * Save a new version of a document
 * Automatically increments version and prunes old versions
 */
export const saveDocument = (
  db: SqliteDatabase,
  projectId: string,
  content: DocumentContent
): ProjectDocument => {
  // Get the current max version
  const versionRow = db
    .prepare(
      `SELECT MAX(version) as max_version
       FROM project_documents
       WHERE project_id = ?`
    )
    .get(projectId) as { max_version: number | null } | undefined;

  const nextVersion = (versionRow?.max_version ?? 0) + 1;
  const id = randomUUID();
  const contentJson = JSON.stringify(content);

  // Insert new version
  db.prepare(
    `INSERT INTO project_documents (id, project_id, version, content)
     VALUES (?, ?, ?, ?)`
  ).run(id, projectId, nextVersion, contentJson);

  // Prune old versions (keep last MAX_VERSIONS)
  db.prepare(
    `DELETE FROM project_documents
     WHERE project_id = ?
     AND version NOT IN (
       SELECT version FROM project_documents
       WHERE project_id = ?
       ORDER BY version DESC
       LIMIT ?
     )`
  ).run(projectId, projectId, MAX_VERSIONS);

  // Return the newly created document
  const newDoc = db
    .prepare(
      `SELECT id, project_id, version, content, created_at, updated_at
       FROM project_documents
       WHERE id = ?`
    )
    .get(id) as {
    id: string;
    project_id: string;
    version: number;
    content: string;
    created_at: string;
    updated_at: string;
  };

  return mapDocumentRow(newDoc);
};

/**
 * Get document history (all versions)
 */
export const getDocumentHistory = (
  db: SqliteDatabase,
  projectId: string,
  limit: number = MAX_VERSIONS
): ProjectDocument[] => {
  const rows = db
    .prepare(
      `SELECT id, project_id, version, content, created_at, updated_at
       FROM project_documents
       WHERE project_id = ?
       ORDER BY version DESC
       LIMIT ?`
    )
    .all(projectId, limit) as Array<{
    id: string;
    project_id: string;
    version: number;
    content: string;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map(mapDocumentRow);
};

/**
 * Get a specific version of a document
 */
export const getDocumentVersion = (
  db: SqliteDatabase,
  projectId: string,
  version: number
): ProjectDocument | null => {
  const row = db
    .prepare(
      `SELECT id, project_id, version, content, created_at, updated_at
       FROM project_documents
       WHERE project_id = ? AND version = ?`
    )
    .get(projectId, version) as
    | {
        id: string;
        project_id: string;
        version: number;
        content: string;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  if (!row) {
    return null;
  }

  return mapDocumentRow(row);
};

/**
 * Restore a previous version by creating a new version with the old content
 */
export const restoreDocumentVersion = (
  db: SqliteDatabase,
  projectId: string,
  version: number
): ProjectDocument | null => {
  const oldVersion = getDocumentVersion(db, projectId, version);
  if (!oldVersion) {
    return null;
  }

  // Create a new version with the old content
  return saveDocument(db, projectId, oldVersion.content);
};

/**
 * Map database row to ProjectDocument
 */
const mapDocumentRow = (row: {
  id: string;
  project_id: string;
  version: number;
  content: string;
  created_at: string;
  updated_at: string;
}): ProjectDocument => ({
  id: row.id,
  projectId: row.project_id,
  version: row.version,
  content: JSON.parse(row.content) as DocumentContent,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
