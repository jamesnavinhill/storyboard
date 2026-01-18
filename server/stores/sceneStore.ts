import { randomUUID } from "node:crypto";
import type { UnifiedDatabase, DatabaseRow } from "../database";
import type { Scene, SceneHistoryEntry, Asset } from "../types";
import { getAssetsByIds } from "./assetStore";
import { getAssetPublicUrl } from "../utils/assetHelpers";

interface SceneInput {
  description: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  orderIndex?: number;
  duration?: number;
}

interface SceneUpdateInput {
  description?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  orderIndex?: number;
  primaryImageAssetId?: string | null;
  primaryVideoAssetId?: string | null;
  duration?: number;
}

interface SceneRow extends DatabaseRow {
  id: string;
  project_id: string;
  description: string;
  aspect_ratio: "16:9" | "9:16" | "1:1";
  order_index: number;
  primary_image_asset_id: string | null;
  primary_video_asset_id: string | null;
  duration: number;
  created_at: string;
  updated_at: string;
}

interface SceneWithGroupRow extends SceneRow {
  group_id: string | null;
}

interface SceneHistoryRow extends DatabaseRow {
  id: string;
  scene_id: string;
  description: string;
  image_asset_id: string | null;
  video_asset_id: string | null;
  created_at: string;
}

interface SceneTagRow extends DatabaseRow {
  scene_id: string;
  tag_id: string;
}

interface MaxOrderRow extends DatabaseRow {
  max_order: number;
}

const SCENE_HISTORY_LIMIT = 10;

async function recordSceneHistoryEntry(
  db: UnifiedDatabase,
  scene: Scene
): Promise<void> {
  const historyId = randomUUID();

  await db.execute(
    `INSERT INTO scene_history (id, scene_id, description, image_asset_id, video_asset_id)
     VALUES (?, ?, ?, ?, ?)`,
    [
      historyId,
      scene.id,
      scene.description,
      scene.primaryImageAssetId ?? null,
      scene.primaryVideoAssetId ?? null,
    ]
  );

  await db.execute(
    `DELETE FROM scene_history
     WHERE scene_id = ?
       AND id NOT IN (
         SELECT id FROM scene_history
         WHERE scene_id = ?
         ORDER BY created_at DESC
         LIMIT ?
       )`,
    [scene.id, scene.id, SCENE_HISTORY_LIMIT]
  );
}

export const getScenesByProject = async (
  db: UnifiedDatabase,
  projectId: string
): Promise<Scene[]> => {
  const result = await db.query<SceneRow>(
    `SELECT id, project_id, description, aspect_ratio, order_index, primary_image_asset_id, primary_video_asset_id, duration, created_at, updated_at
     FROM scenes WHERE project_id = ? ORDER BY order_index ASC`,
    [projectId]
  );
  return result.rows.map(mapSceneRow);
};

export const createScenes = async (
  db: UnifiedDatabase,
  projectId: string,
  scenes: SceneInput[]
): Promise<Scene[]> => {
  const orderRow = await db.queryOne<MaxOrderRow>(
    `SELECT COALESCE(MAX(order_index), -1) AS max_order FROM scenes WHERE project_id = ?`,
    [projectId]
  );
  let currentOrder = (orderRow?.max_order ?? -1) + 1;

  const created: Scene[] = [];

  for (const scene of scenes) {
    const id = randomUUID();
    const orderIndex = scene.orderIndex ?? currentOrder++;
    const duration = scene.duration ?? 5;

    await db.execute(
      `INSERT INTO scenes (id, project_id, description, aspect_ratio, order_index, duration)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, projectId, scene.description, scene.aspectRatio, orderIndex, duration]
    );

    const row = await db.queryOne<SceneRow>(
      `SELECT id, project_id, description, aspect_ratio, order_index, primary_image_asset_id, primary_video_asset_id, duration, created_at, updated_at FROM scenes WHERE id = ?`,
      [id]
    );

    if (row) {
      created.push(mapSceneRow(row));
    }
  }

  return created;
};

export const updateScene = async (
  db: UnifiedDatabase,
  projectId: string,
  sceneId: string,
  updates: SceneUpdateInput
): Promise<Scene | null> => {
  const existing = await getSceneById(db, projectId, sceneId);
  if (!existing) {
    return null;
  }

  const fields: string[] = [];
  const params: unknown[] = [];

  if (updates.description !== undefined) {
    fields.push("description = ?");
    params.push(updates.description);
  }
  if (updates.aspectRatio !== undefined) {
    fields.push("aspect_ratio = ?");
    params.push(updates.aspectRatio);
  }
  if (updates.orderIndex !== undefined) {
    fields.push("order_index = ?");
    params.push(updates.orderIndex);
  }
  if (updates.primaryImageAssetId !== undefined) {
    fields.push("primary_image_asset_id = ?");
    params.push(updates.primaryImageAssetId);
  }
  if (updates.primaryVideoAssetId !== undefined) {
    fields.push("primary_video_asset_id = ?");
    params.push(updates.primaryVideoAssetId);
  }
  if (updates.duration !== undefined) {
    fields.push("duration = ?");
    params.push(updates.duration);
  }

  if (fields.length === 0) {
    return existing;
  }

  const nextImageAssetId =
    updates.primaryImageAssetId !== undefined
      ? updates.primaryImageAssetId ?? null
      : existing.primaryImageAssetId ?? null;
  const nextVideoAssetId =
    updates.primaryVideoAssetId !== undefined
      ? updates.primaryVideoAssetId ?? null
      : existing.primaryVideoAssetId ?? null;

  const shouldRecordHistory =
    (updates.description !== undefined &&
      updates.description !== existing.description) ||
    (updates.primaryImageAssetId !== undefined &&
      nextImageAssetId !== (existing.primaryImageAssetId ?? null)) ||
    (updates.primaryVideoAssetId !== undefined &&
      nextVideoAssetId !== (existing.primaryVideoAssetId ?? null));

  if (shouldRecordHistory) {
    await recordSceneHistoryEntry(db, existing);
  }

  params.push(sceneId, projectId);
  const sql = `UPDATE scenes SET ${fields.join(", ")} WHERE id = ? AND project_id = ?`;
  const result = await db.execute(sql, params);

  if (result.changes === 0) {
    return null;
  }

  return getSceneById(db, projectId, sceneId);
};

export const getSceneById = async (
  db: UnifiedDatabase,
  projectId: string,
  sceneId: string
): Promise<Scene | null> => {
  const row = await db.queryOne<SceneRow>(
    `SELECT id, project_id, description, aspect_ratio, order_index, primary_image_asset_id, primary_video_asset_id, duration, created_at, updated_at FROM scenes WHERE id = ? AND project_id = ?`,
    [sceneId, projectId]
  );
  return row ? mapSceneRow(row) : null;
};

export const reorderScenes = async (
  db: UnifiedDatabase,
  projectId: string,
  sceneIds: string[]
): Promise<Scene[]> => {
  for (let index = 0; index < sceneIds.length; index++) {
    await db.execute(
      `UPDATE scenes SET order_index = ? WHERE id = ? AND project_id = ?`,
      [index, sceneIds[index], projectId]
    );
  }

  return getScenesByProject(db, projectId);
};

export const deleteScene = async (
  db: UnifiedDatabase,
  projectId: string,
  sceneId: string
): Promise<boolean> => {
  const result = await db.execute(
    `DELETE FROM scenes WHERE id = ? AND project_id = ?`,
    [sceneId, projectId]
  );

  if (result.changes === 0) return false;

  const remaining = await getScenesByProject(db, projectId);

  for (let idx = 0; idx < remaining.length; idx++) {
    await db.execute(
      `UPDATE scenes SET order_index = ? WHERE id = ? AND project_id = ?`,
      [idx, remaining[idx].id, projectId]
    );
  }

  return true;
};

export const getSceneHistory = async (
  db: UnifiedDatabase,
  sceneId: string
): Promise<SceneHistoryEntry[]> => {
  const result = await db.query<SceneHistoryRow>(
    `SELECT id, scene_id, description, image_asset_id, video_asset_id, created_at
     FROM scene_history
     WHERE scene_id = ?
     ORDER BY created_at DESC, id DESC`,
    [sceneId]
  );

  const entries = result.rows.map(mapSceneHistoryRow);
  const assetIds = Array.from(
    new Set(
      entries
        .flatMap((entry) => [entry.imageAssetId, entry.videoAssetId])
        .filter((id): id is string => Boolean(id))
    )
  );

  if (assetIds.length === 0) {
    return entries;
  }

  const assets = await getAssetsByIds(db, assetIds);
  const assetMap = new Map<string, Asset>(
    assets.map((asset) => [asset.id, asset])
  );

  return entries.map((entry) => {
    const imageAsset = entry.imageAssetId
      ? assetMap.get(entry.imageAssetId)
      : null;
    const videoAsset = entry.videoAssetId
      ? assetMap.get(entry.videoAssetId)
      : null;
    return {
      ...entry,
      imageUrl: imageAsset ? getAssetPublicUrl(imageAsset) : null,
      videoUrl: videoAsset ? getAssetPublicUrl(videoAsset) : null,
    };
  });
};

export const restoreSceneFromHistory = async (
  db: UnifiedDatabase,
  projectId: string,
  sceneId: string,
  historyId: string
): Promise<Scene | null> => {
  const existing = await getSceneById(db, projectId, sceneId);
  if (!existing) {
    return null;
  }

  const row = await db.queryOne<SceneHistoryRow>(
    `SELECT id, scene_id, description, image_asset_id, video_asset_id, created_at
     FROM scene_history
     WHERE id = ? AND scene_id = ?`,
    [historyId, sceneId]
  );

  if (!row) {
    return null;
  }

  await recordSceneHistoryEntry(db, existing);

  await db.execute(
    `UPDATE scenes
       SET description = ?,
           primary_image_asset_id = ?,
           primary_video_asset_id = ?
     WHERE id = ? AND project_id = ?`,
    [
      row.description,
      row.image_asset_id ?? null,
      row.video_asset_id ?? null,
      sceneId,
      projectId,
    ]
  );

  return getSceneById(db, projectId, sceneId);
};

export const getScenesWithGroups = async (
  db: UnifiedDatabase,
  projectId: string
): Promise<Array<Scene & { groupId: string | null }>> => {
  const result = await db.query<SceneWithGroupRow>(
    `SELECT s.id, s.project_id, s.description, s.aspect_ratio, s.order_index,
            s.primary_image_asset_id, s.primary_video_asset_id, s.duration, s.created_at, s.updated_at,
            sgm.group_id
     FROM scenes s
     LEFT JOIN scene_group_members sgm ON s.id = sgm.scene_id
     WHERE s.project_id = ?
     ORDER BY s.order_index ASC`,
    [projectId]
  );

  return result.rows.map((row) => ({
    ...mapSceneRow(row),
    groupId: row.group_id ?? null,
  }));
};

export const getScenesWithTags = async (
  db: UnifiedDatabase,
  projectId: string
): Promise<Array<Scene & { tagIds: string[] }>> => {
  const scenes = await getScenesByProject(db, projectId);

  const sceneTagsMap = new Map<string, string[]>();

  if (scenes.length > 0) {
    const sceneIds = scenes.map((s) => s.id);
    const placeholders = sceneIds.map(() => "?").join(",");

    const result = await db.query<SceneTagRow>(
      `SELECT sta.scene_id, sta.tag_id
       FROM scene_tag_assignments sta
       WHERE sta.scene_id IN (${placeholders})`,
      sceneIds
    );

    for (const row of result.rows) {
      if (!sceneTagsMap.has(row.scene_id)) {
        sceneTagsMap.set(row.scene_id, []);
      }
      sceneTagsMap.get(row.scene_id)!.push(row.tag_id);
    }
  }

  return scenes.map((scene) => ({
    ...scene,
    tagIds: sceneTagsMap.get(scene.id) ?? [],
  }));
};

// Mappers

const mapSceneRow = (row: SceneRow): Scene => ({
  id: row.id,
  projectId: row.project_id,
  description: row.description,
  aspectRatio: row.aspect_ratio,
  orderIndex: row.order_index,
  primaryImageAssetId: row.primary_image_asset_id ?? null,
  primaryVideoAssetId: row.primary_video_asset_id ?? null,
  duration: row.duration,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

function mapSceneHistoryRow(row: SceneHistoryRow): SceneHistoryEntry {
  return {
    id: row.id,
    sceneId: row.scene_id,
    description: row.description,
    imageAssetId: row.image_asset_id ?? null,
    videoAssetId: row.video_asset_id ?? null,
    imageUrl: null,
    videoUrl: null,
    createdAt: row.created_at,
  };
}
