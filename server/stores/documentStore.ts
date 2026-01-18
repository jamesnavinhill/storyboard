import { randomUUID } from "node:crypto";
import type { UnifiedDatabase, DatabaseRow } from "../database";

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

interface DocumentRow extends DatabaseRow {
  id: string;
  project_id: string;
  version: number;
  content: string;
  created_at: string;
  updated_at: string;
}

interface VersionRow extends DatabaseRow {
  max_version: number | null;
}

const MAX_VERSIONS = 10;

/**
 * Map database row to ProjectDocument
 */
const mapDocumentRow = (row: DocumentRow): ProjectDocument => ({
  id: row.id,
  projectId: row.project_id,
  version: row.version,
  content: JSON.parse(row.content) as DocumentContent,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Get the latest document for a project
 */
export const getDocument = async (
  db: UnifiedDatabase,
  projectId: string
): Promise<ProjectDocument | null> => {
  const row = await db.queryOne<DocumentRow>(
    `SELECT id, project_id, version, content, created_at, updated_at
     FROM project_documents
     WHERE project_id = ?
     ORDER BY version DESC
     LIMIT 1`,
    [projectId]
  );

  if (!row) {
    return null;
  }

  return mapDocumentRow(row);
};

/**
 * Save a new version of a document
 * Automatically increments version and prunes old versions
 */
export const saveDocument = async (
  db: UnifiedDatabase,
  projectId: string,
  content: DocumentContent
): Promise<ProjectDocument> => {
  // Get the current max version
  const versionRow = await db.queryOne<VersionRow>(
    `SELECT MAX(version) as max_version
     FROM project_documents
     WHERE project_id = ?`,
    [projectId]
  );

  const nextVersion = (versionRow?.max_version ?? 0) + 1;
  const id = randomUUID();
  const contentJson = JSON.stringify(content);

  // Insert new version
  await db.execute(
    `INSERT INTO project_documents (id, project_id, version, content)
     VALUES (?, ?, ?, ?)`,
    [id, projectId, nextVersion, contentJson]
  );

  // Prune old versions (keep last MAX_VERSIONS)
  await db.execute(
    `DELETE FROM project_documents
     WHERE project_id = ?
     AND version NOT IN (
       SELECT version FROM project_documents
       WHERE project_id = ?
       ORDER BY version DESC
       LIMIT ?
     )`,
    [projectId, projectId, MAX_VERSIONS]
  );

  // Return the newly created document
  const newDoc = await db.queryOne<DocumentRow>(
    `SELECT id, project_id, version, content, created_at, updated_at
     FROM project_documents
     WHERE id = ?`,
    [id]
  );

  if (!newDoc) {
    throw new Error("Failed to create document");
  }

  return mapDocumentRow(newDoc);
};

/**
 * Get document history (all versions)
 */
export const getDocumentHistory = async (
  db: UnifiedDatabase,
  projectId: string,
  limit: number = MAX_VERSIONS
): Promise<ProjectDocument[]> => {
  const result = await db.query<DocumentRow>(
    `SELECT id, project_id, version, content, created_at, updated_at
     FROM project_documents
     WHERE project_id = ?
     ORDER BY version DESC
     LIMIT ?`,
    [projectId, limit]
  );

  return result.rows.map(mapDocumentRow);
};

/**
 * Get a specific version of a document
 */
export const getDocumentVersion = async (
  db: UnifiedDatabase,
  projectId: string,
  version: number
): Promise<ProjectDocument | null> => {
  const row = await db.queryOne<DocumentRow>(
    `SELECT id, project_id, version, content, created_at, updated_at
     FROM project_documents
     WHERE project_id = ? AND version = ?`,
    [projectId, version]
  );

  if (!row) {
    return null;
  }

  return mapDocumentRow(row);
};

/**
 * Restore a previous version by creating a new version with the old content
 */
export const restoreDocumentVersion = async (
  db: UnifiedDatabase,
  projectId: string,
  version: number
): Promise<ProjectDocument | null> => {
  const oldVersion = await getDocumentVersion(db, projectId, version);
  if (!oldVersion) {
    return null;
  }

  // Create a new version with the old content
  return saveDocument(db, projectId, oldVersion.content);
};
