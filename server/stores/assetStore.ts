import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import type { UnifiedDatabase, DatabaseRow } from "../database";
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

interface AssetRow extends DatabaseRow {
  id: string;
  project_id: string;
  scene_id: string | null;
  type: "image" | "video" | "attachment";
  mime_type: string;
  file_name: string;
  file_path: string;
  size: number;
  checksum: string | null;
  metadata: string | null;
  created_at: string;
}

const mapAssetRow = (row: AssetRow): Asset => ({
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
});

export const createAsset = async (
  db: UnifiedDatabase,
  input: CreateAssetInput
): Promise<Asset> => {
  const id = randomUUID();

  await db.execute(
    `INSERT INTO assets (id, project_id, scene_id, type, mime_type, file_name, file_path, size, checksum, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.projectId,
      input.sceneId ?? null,
      input.type,
      input.mimeType,
      input.fileName,
      input.filePath,
      input.size,
      input.checksum ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
    ]
  );

  const row = await db.queryOne<AssetRow>(
    `SELECT id, project_id, scene_id, type, mime_type, file_name, file_path, size, checksum, metadata, created_at FROM assets WHERE id = ?`,
    [id]
  );

  if (!row) {
    throw new Error("Failed to create asset");
  }

  return mapAssetRow(row);
};

export const getAssetById = async (
  db: UnifiedDatabase,
  assetId: string
): Promise<Asset | null> => {
  const row = await db.queryOne<AssetRow>(
    `SELECT id, project_id, scene_id, type, mime_type, file_name, file_path, size, checksum, metadata, created_at FROM assets WHERE id = ?`,
    [assetId]
  );

  return row ? mapAssetRow(row) : null;
};

export const getAssetsByIds = async (
  db: UnifiedDatabase,
  assetIds: string[]
): Promise<Asset[]> => {
  if (assetIds.length === 0) {
    return [];
  }
  const placeholders = assetIds.map(() => "?").join(",");
  const result = await db.query<AssetRow>(
    `SELECT id, project_id, scene_id, type, mime_type, file_name, file_path, size, checksum, metadata, created_at FROM assets WHERE id IN (${placeholders})`,
    assetIds
  );

  return result.rows.map(mapAssetRow);
};

export const listAssets = async (db: UnifiedDatabase): Promise<Asset[]> => {
  const result = await db.query<AssetRow>(
    `SELECT id, project_id, scene_id, type, mime_type, file_name, file_path, size, checksum, metadata, created_at FROM assets`
  );

  return result.rows.map(mapAssetRow);
};

interface AssetFilters {
  type?: "image" | "video" | "attachment";
  sceneId?: string;
}

export const listAssetsByProject = async (
  db: UnifiedDatabase,
  projectId: string,
  filters?: AssetFilters
): Promise<Asset[]> => {
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

  const result = await db.query<AssetRow>(sql, params);

  return result.rows.map(mapAssetRow);
};

export const updateAsset = async (
  db: UnifiedDatabase,
  assetId: string,
  updates: { fileName?: string; metadata?: Record<string, unknown> }
): Promise<Asset | null> => {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (updates.fileName !== undefined) {
    const sanitizedFileName = path.basename(updates.fileName);
    fields.push("file_name = ?");
    params.push(sanitizedFileName);
  }

  if (updates.metadata !== undefined) {
    fields.push("metadata = ?");
    params.push(JSON.stringify(updates.metadata));
  }

  if (fields.length === 0) {
    return getAssetById(db, assetId);
  }

  params.push(assetId);
  const sql = `UPDATE assets SET ${fields.join(", ")} WHERE id = ?`;
  const result = await db.execute(sql, params);

  if (result.changes === 0) {
    return null;
  }

  return getAssetById(db, assetId);
};

export const deleteAsset = async (
  db: UnifiedDatabase,
  config: AppConfig,
  assetId: string
): Promise<void> => {
  const asset = await getAssetById(db, assetId);
  if (!asset) {
    return;
  }

  await db.execute(
    `UPDATE scenes SET primary_image_asset_id = NULL WHERE primary_image_asset_id = ?`,
    [assetId]
  );

  await db.execute(
    `UPDATE scenes SET primary_video_asset_id = NULL WHERE primary_video_asset_id = ?`,
    [assetId]
  );

  await db.execute(`DELETE FROM assets WHERE id = ?`, [assetId]);

  try {
    await fs.access(asset.filePath);
    await fs.unlink(asset.filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error(`Failed to delete asset file: ${asset.filePath}`, error);
    }
  }
};
