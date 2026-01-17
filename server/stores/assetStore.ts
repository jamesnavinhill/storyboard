import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import type { Database as SqliteDatabase } from "better-sqlite3";
import type { Asset } from "../types";
import type { AppConfig } from "../config";

interface CreateAssetInput {
  projectId: string;
  sceneId?: string;
  type: "image" | "video" | "attachment";
  mimeType: string;
  fileName: string;
  filePath: string;
  size: number;
  checksum?: string;
  metadata?: Record<string, unknown> | null;
}

export const createAsset = (
  db: SqliteDatabase,
  input: CreateAssetInput
): Asset => {
  const id = randomUUID();
  db.prepare<{
    id: string;
    projectId: string;
    sceneId?: string;
    type: string;
    mimeType: string;
    fileName: string;
    filePath: string;
    size: number;
    checksum?: string;
    metadata?: string | null;
  }>(
    `INSERT INTO assets (id, project_id, scene_id, type, mime_type, file_name, file_path, size, checksum, metadata)
     VALUES (@id, @projectId, @sceneId, @type, @mimeType, @fileName, @filePath, @size, @checksum, @metadata)`
  ).run({
    id,
    projectId: input.projectId,
    sceneId: input.sceneId,
    type: input.type,
    mimeType: input.mimeType,
    fileName: input.fileName,
    filePath: input.filePath,
    size: input.size,
    checksum: input.checksum,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });

  const row = db
    .prepare(
      `SELECT id, project_id, scene_id, type, mime_type, file_name, file_path, size, checksum, metadata, created_at FROM assets WHERE id = ?`
    )
    .get(id) as {
    id: string;
    project_id: string;
    scene_id?: string | null;
    type: "image" | "video" | "attachment";
    mime_type: string;
    file_name: string;
    file_path: string;
    size: number;
    checksum?: string | null;
    metadata?: string | null;
    created_at: string;
  };

  return {
    id: row.id,
    projectId: row.project_id,
    sceneId: row.scene_id ?? null,
    type: row.type,
    mimeType: row.mime_type,
    fileName: row.file_name,
    filePath: row.file_path,
    size: row.size,
    checksum: row.checksum ?? null,
    metadata: row.metadata
      ? (JSON.parse(row.metadata) as Record<string, unknown>)
      : null,
    createdAt: row.created_at,
  };
};

export const getAssetById = (
  db: SqliteDatabase,
  assetId: string
): Asset | null => {
  const row = db
    .prepare(
      `SELECT id, project_id, scene_id, type, mime_type, file_name, file_path, size, checksum, metadata, created_at FROM assets WHERE id = ?`
    )
    .get(assetId) as
    | {
        id: string;
        project_id: string;
        scene_id?: string | null;
        type: "image" | "video" | "attachment";
        mime_type: string;
        file_name: string;
        file_path: string;
        size: number;
        checksum?: string | null;
        metadata?: string | null;
        created_at: string;
      }
    | undefined;
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    projectId: row.project_id,
    sceneId: row.scene_id ?? null,
    type: row.type,
    mimeType: row.mime_type,
    fileName: row.file_name,
    filePath: row.file_path,
    size: row.size,
    checksum: row.checksum ?? null,
    metadata: row.metadata
      ? (JSON.parse(row.metadata) as Record<string, unknown>)
      : null,
    createdAt: row.created_at,
  };
};

export const getAssetsByIds = (
  db: SqliteDatabase,
  assetIds: string[]
): Asset[] => {
  if (assetIds.length === 0) {
    return [];
  }
  const placeholders = assetIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT id, project_id, scene_id, type, mime_type, file_name, file_path, size, checksum, metadata, created_at FROM assets WHERE id IN (${placeholders})`
    )
    .all(...assetIds) as Array<{
    id: string;
    project_id: string;
    scene_id?: string | null;
    type: "image" | "video" | "attachment";
    mime_type: string;
    file_name: string;
    file_path: string;
    size: number;
    checksum?: string | null;
    metadata?: string | null;
    created_at: string;
  }>;
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    sceneId: row.scene_id ?? null,
    type: row.type,
    mimeType: row.mime_type,
    fileName: row.file_name,
    filePath: row.file_path,
    size: row.size,
    checksum: row.checksum ?? null,
    metadata: row.metadata
      ? (JSON.parse(row.metadata) as Record<string, unknown>)
      : null,
    createdAt: row.created_at,
  }));
};

export const listAssets = (db: SqliteDatabase): Asset[] => {
  const rows = db
    .prepare(
      `SELECT id, project_id, scene_id, type, mime_type, file_name, file_path, size, checksum, metadata, created_at FROM assets`
    )
    .all() as Array<{
    id: string;
    project_id: string;
    scene_id?: string | null;
    type: "image" | "video" | "attachment";
    mime_type: string;
    file_name: string;
    file_path: string;
    size: number;
    checksum?: string | null;
    metadata?: string | null;
    created_at: string;
  }>;
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    sceneId: row.scene_id ?? null,
    type: row.type,
    mimeType: row.mime_type,
    fileName: row.file_name,
    filePath: row.file_path,
    size: row.size,
    checksum: row.checksum ?? null,
    metadata: row.metadata
      ? (JSON.parse(row.metadata) as Record<string, unknown>)
      : null,
    createdAt: row.created_at,
  }));
};

interface AssetFilters {
  type?: "image" | "video" | "attachment";
  sceneId?: string;
}

export const listAssetsByProject = (
  db: SqliteDatabase,
  projectId: string,
  filters?: AssetFilters
): Asset[] => {
  let sql = `SELECT id, project_id, scene_id, type, mime_type, file_name, file_path, size, checksum, metadata, created_at FROM assets WHERE project_id = ?`;
  const params: (string | undefined)[] = [projectId];

  if (filters?.type) {
    sql += ` AND type = ?`;
    params.push(filters.type);
  }

  if (filters?.sceneId) {
    sql += ` AND scene_id = ?`;
    params.push(filters.sceneId);
  }

  sql += ` ORDER BY created_at DESC`;

  const rows = db.prepare(sql).all(...params) as Array<{
    id: string;
    project_id: string;
    scene_id?: string | null;
    type: "image" | "video" | "attachment";
    mime_type: string;
    file_name: string;
    file_path: string;
    size: number;
    checksum?: string | null;
    metadata?: string | null;
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    sceneId: row.scene_id ?? null,
    type: row.type,
    mimeType: row.mime_type,
    fileName: row.file_name,
    filePath: row.file_path,
    size: row.size,
    checksum: row.checksum ?? null,
    metadata: row.metadata
      ? (JSON.parse(row.metadata) as Record<string, unknown>)
      : null,
    createdAt: row.created_at,
  }));
};

export const updateAsset = (
  db: SqliteDatabase,
  assetId: string,
  updates: { fileName?: string; metadata?: Record<string, unknown> }
): Asset | null => {
  const fields: string[] = [];
  const params: Record<string, unknown> = { assetId };

  if (updates.fileName !== undefined) {
    // Sanitize fileName to prevent path traversal
    const sanitizedFileName = path.basename(updates.fileName);
    fields.push("file_name = @fileName");
    params.fileName = sanitizedFileName;
  }

  if (updates.metadata !== undefined) {
    fields.push("metadata = @metadata");
    params.metadata = JSON.stringify(updates.metadata);
  }

  if (fields.length === 0) {
    return getAssetById(db, assetId);
  }

  const sql = `UPDATE assets SET ${fields.join(", ")} WHERE id = @assetId`;
  const result = db.prepare(sql).run(params);

  if (result.changes === 0) {
    return null;
  }

  return getAssetById(db, assetId);
};

export const deleteAsset = (
  db: SqliteDatabase,
  config: AppConfig,
  assetId: string
): void => {
  // Get asset before deletion to access file path
  const asset = getAssetById(db, assetId);
  if (!asset) {
    return;
  }

  // Update any scenes referencing this asset (set to NULL)
  db.prepare(
    `UPDATE scenes SET primary_image_asset_id = NULL WHERE primary_image_asset_id = ?`
  ).run(assetId);
  
  db.prepare(
    `UPDATE scenes SET primary_video_asset_id = NULL WHERE primary_video_asset_id = ?`
  ).run(assetId);

  // Delete database record
  db.prepare(`DELETE FROM assets WHERE id = ?`).run(assetId);

  // Delete file from disk
  try {
    if (fs.existsSync(asset.filePath)) {
      fs.unlinkSync(asset.filePath);
    }
  } catch (error) {
    console.error(`Failed to delete asset file: ${asset.filePath}`, error);
  }
};
