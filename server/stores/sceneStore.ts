import { randomUUID } from "node:crypto";
import type { Database as SqliteDatabase } from "better-sqlite3";
import type { Scene, SceneHistoryEntry, Asset } from "../types";
import { getAssetsByIds } from "./assetStore";
import { getAssetPublicUrl } from "../utils/assetHelpers";

interface SceneInput {
  description: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  orderIndex?: number;
  duration?: number; // Duration in seconds, defaults to 5
}

interface SceneUpdateInput {
  description?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  orderIndex?: number;
  primaryImageAssetId?: string | null;
  primaryVideoAssetId?: string | null;
  duration?: number; // Duration in seconds
}

const SCENE_HISTORY_LIMIT = 10;

function recordSceneHistoryEntry(db: SqliteDatabase, scene: Scene): void {
  const historyId = randomUUID();

  db.prepare<{
    id: string;
    sceneId: string;
    description: string;
    imageAssetId?: string | null;
    videoAssetId?: string | null;
  }>(
    `INSERT INTO scene_history (id, scene_id, description, image_asset_id, video_asset_id)
     VALUES (@id, @sceneId, @description, @imageAssetId, @videoAssetId)`
  ).run({
    id: historyId,
    sceneId: scene.id,
    description: scene.description,
    imageAssetId: scene.primaryImageAssetId ?? null,
    videoAssetId: scene.primaryVideoAssetId ?? null,
  });

  db.prepare<{
    sceneId: string;
    limit: number;
  }>(
    `DELETE FROM scene_history
     WHERE scene_id = @sceneId
       AND id NOT IN (
         SELECT id FROM scene_history
         WHERE scene_id = @sceneId
         ORDER BY created_at DESC
         LIMIT @limit
       )`
  ).run({
    sceneId: scene.id,
    limit: SCENE_HISTORY_LIMIT,
  });
}

export const getScenesByProject = (
  db: SqliteDatabase,
  projectId: string
): Scene[] => {
  const rows = db
    .prepare(
      `SELECT id, project_id, description, aspect_ratio, order_index, primary_image_asset_id, primary_video_asset_id, duration, created_at, updated_at
       FROM scenes WHERE project_id = ? ORDER BY order_index ASC`
    )
    .all(projectId) as Array<{
    id: string;
    project_id: string;
    description: string;
    aspect_ratio: "16:9" | "9:16" | "1:1";
    order_index: number;
    primary_image_asset_id?: string | null;
    primary_video_asset_id?: string | null;
    duration: number;
    created_at: string;
    updated_at: string;
  }>;
  return rows.map(mapSceneRow);
};

export const createScenes = (
  db: SqliteDatabase,
  projectId: string,
  scenes: SceneInput[]
): Scene[] => {
  const orderStmt = db.prepare<{ projectId: string }>(
    `SELECT COALESCE(MAX(order_index), -1) AS max_order FROM scenes WHERE project_id = @projectId`
  );
  let currentOrder =
    (orderStmt.get({ projectId }) as { max_order: number }).max_order + 1;

  const insert = db.prepare<{
    id: string;
    projectId: string;
    description: string;
    aspectRatio: "16:9" | "9:16" | "1:1";
    orderIndex: number;
    duration: number;
  }>(
    `INSERT INTO scenes (id, project_id, description, aspect_ratio, order_index, duration)
     VALUES (@id, @projectId, @description, @aspectRatio, @orderIndex, @duration)`
  );

  const created: Scene[] = [];

  const transaction = db.transaction((inputs: SceneInput[]) => {
    for (const scene of inputs) {
      const id = randomUUID();
      const orderIndex = scene.orderIndex ?? currentOrder++;
      const duration = scene.duration ?? 5; // Default to 5 seconds
      insert.run({
        id,
        projectId,
        description: scene.description,
        aspectRatio: scene.aspectRatio,
        orderIndex,
        duration,
      });
      const row = db
        .prepare(
          `SELECT id, project_id, description, aspect_ratio, order_index, primary_image_asset_id, primary_video_asset_id, duration, created_at, updated_at FROM scenes WHERE id = ?`
        )
        .get(id) as {
        id: string;
        project_id: string;
        description: string;
        aspect_ratio: "16:9" | "9:16" | "1:1";
        order_index: number;
        primary_image_asset_id?: string | null;
        primary_video_asset_id?: string | null;
        duration: number;
        created_at: string;
        updated_at: string;
      };
      created.push(mapSceneRow(row));
    }
  });

  transaction(scenes);
  return created;
};

export const updateScene = (
  db: SqliteDatabase,
  projectId: string,
  sceneId: string,
  updates: SceneUpdateInput
): Scene | null => {
  const existing = getSceneById(db, projectId, sceneId);
  if (!existing) {
    return null;
  }

  const fields: string[] = [];
  const params: Record<string, unknown> = { projectId, sceneId };

  if (updates.description !== undefined) {
    fields.push("description = @description");
    params.description = updates.description;
  }
  if (updates.aspectRatio !== undefined) {
    fields.push("aspect_ratio = @aspectRatio");
    params.aspectRatio = updates.aspectRatio;
  }
  if (updates.orderIndex !== undefined) {
    fields.push("order_index = @orderIndex");
    params.orderIndex = updates.orderIndex;
  }
  if (updates.primaryImageAssetId !== undefined) {
    fields.push("primary_image_asset_id = @primaryImageAssetId");
    params.primaryImageAssetId = updates.primaryImageAssetId;
  }
  if (updates.primaryVideoAssetId !== undefined) {
    fields.push("primary_video_asset_id = @primaryVideoAssetId");
    params.primaryVideoAssetId = updates.primaryVideoAssetId;
  }
  if (updates.duration !== undefined) {
    fields.push("duration = @duration");
    params.duration = updates.duration;
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
    recordSceneHistoryEntry(db, existing);
  }

  const sql = `UPDATE scenes SET ${fields.join(
    ", "
  )} WHERE id = @sceneId AND project_id = @projectId`;
  const result = db.prepare(sql).run(params);
  if (result.changes === 0) {
    return null;
  }
  return getSceneById(db, projectId, sceneId);
};

export const getSceneById = (
  db: SqliteDatabase,
  projectId: string,
  sceneId: string
): Scene | null => {
  const row = db
    .prepare(
      `SELECT id, project_id, description, aspect_ratio, order_index, primary_image_asset_id, primary_video_asset_id, duration, created_at, updated_at FROM scenes WHERE id = ? AND project_id = ?`
    )
    .get(sceneId, projectId) as
    | {
        id: string;
        project_id: string;
        description: string;
        aspect_ratio: "16:9" | "9:16" | "1:1";
        order_index: number;
        primary_image_asset_id?: string | null;
        primary_video_asset_id?: string | null;
        duration: number;
        created_at: string;
        updated_at: string;
      }
    | undefined;
  return row ? mapSceneRow(row) : null;
};

export const reorderScenes = (
  db: SqliteDatabase,
  projectId: string,
  sceneIds: string[]
): Scene[] => {
  const updateStmt = db.prepare<{
    sceneId: string;
    projectId: string;
    orderIndex: number;
  }>(
    `UPDATE scenes SET order_index = @orderIndex WHERE id = @sceneId AND project_id = @projectId`
  );

  const transaction = db.transaction((ids: string[]) => {
    ids.forEach((sceneId, index) => {
      updateStmt.run({
        sceneId,
        projectId,
        orderIndex: index,
      });
    });
  });

  transaction(sceneIds);
  return getScenesByProject(db, projectId);
};

export const deleteScene = (
  db: SqliteDatabase,
  projectId: string,
  sceneId: string
): boolean => {
  // Delete scene row; FKs take care of cascading membership/history; assets/chat become unassigned
  const result = db
    .prepare(`DELETE FROM scenes WHERE id = ? AND project_id = ?`)
    .run(sceneId, projectId);
  if (result.changes === 0) return false;

  // Re-index remaining scenes to keep order_index contiguous
  const remaining = getScenesByProject(db, projectId);
  const update = db.prepare<{
    sceneId: string;
    projectId: string;
    orderIndex: number;
  }>(
    `UPDATE scenes SET order_index = @orderIndex WHERE id = @sceneId AND project_id = @projectId`
  );
  const tx = db.transaction((scenes: Scene[]) => {
    scenes.forEach((s, idx) =>
      update.run({ sceneId: s.id, projectId, orderIndex: idx })
    );
  });
  tx(remaining);
  return true;
};

export const getSceneHistory = (
  db: SqliteDatabase,
  sceneId: string
): SceneHistoryEntry[] => {
  const rows = db
    .prepare(
      `SELECT id, scene_id, description, image_asset_id, video_asset_id, created_at
       FROM scene_history
       WHERE scene_id = ?
       ORDER BY created_at DESC, id DESC`
    )
    .all(sceneId) as Array<{
    id: string;
    scene_id: string;
    description: string;
    image_asset_id?: string | null;
    video_asset_id?: string | null;
    created_at: string;
  }>;

  const entries = rows.map(mapSceneHistoryRow);
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

  const assets = getAssetsByIds(db, assetIds);
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

export const restoreSceneFromHistory = (
  db: SqliteDatabase,
  projectId: string,
  sceneId: string,
  historyId: string
): Scene | null => {
  const existing = getSceneById(db, projectId, sceneId);
  if (!existing) {
    return null;
  }

  const row = db
    .prepare(
      `SELECT id, scene_id, description, image_asset_id, video_asset_id, created_at
       FROM scene_history
       WHERE id = ? AND scene_id = ?`
    )
    .get(historyId, sceneId) as
    | {
        id: string;
        scene_id: string;
        description: string;
        image_asset_id?: string | null;
        video_asset_id?: string | null;
        created_at: string;
      }
    | undefined;

  if (!row) {
    return null;
  }

  recordSceneHistoryEntry(db, existing);

  db.prepare(
    `UPDATE scenes
       SET description = @description,
           primary_image_asset_id = @imageAssetId,
           primary_video_asset_id = @videoAssetId
     WHERE id = @sceneId AND project_id = @projectId`
  ).run({
    description: row.description,
    imageAssetId: row.image_asset_id ?? null,
    videoAssetId: row.video_asset_id ?? null,
    sceneId,
    projectId,
  });

  return getSceneById(db, projectId, sceneId);
};

export const getScenesWithGroups = (
  db: SqliteDatabase,
  projectId: string
): Array<Scene & { groupId?: string | null }> => {
  const rows = db
    .prepare(
      `SELECT s.id, s.project_id, s.description, s.aspect_ratio, s.order_index,
              s.primary_image_asset_id, s.primary_video_asset_id, s.duration, s.created_at, s.updated_at,
              sgm.group_id
       FROM scenes s
       LEFT JOIN scene_group_members sgm ON s.id = sgm.scene_id
       WHERE s.project_id = ?
       ORDER BY s.order_index ASC`
    )
    .all(projectId) as Array<{
    id: string;
    project_id: string;
    description: string;
    aspect_ratio: "16:9" | "9:16" | "1:1";
    order_index: number;
    primary_image_asset_id?: string | null;
    primary_video_asset_id?: string | null;
    duration: number;
    created_at: string;
    updated_at: string;
    group_id?: string | null;
  }>;

  return rows.map((row) => ({
    ...mapSceneRow(row),
    groupId: row.group_id ?? null,
  }));
};

export const getScenesWithTags = (
  db: SqliteDatabase,
  projectId: string
): Array<Scene & { tagIds: string[] }> => {
  const scenes = getScenesByProject(db, projectId);

  const sceneTagsMap = new Map<string, string[]>();

  if (scenes.length > 0) {
    const sceneIds = scenes.map((s) => s.id);
    const placeholders = sceneIds.map(() => "?").join(",");

    const rows = db
      .prepare(
        `SELECT sta.scene_id, sta.tag_id
         FROM scene_tag_assignments sta
         WHERE sta.scene_id IN (${placeholders})`
      )
      .all(...sceneIds) as Array<{
      scene_id: string;
      tag_id: string;
    }>;

    for (const row of rows) {
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

const mapSceneRow = (row: {
  id: string;
  project_id: string;
  description: string;
  aspect_ratio: "16:9" | "9:16" | "1:1";
  order_index: number;
  primary_image_asset_id?: string | null;
  primary_video_asset_id?: string | null;
  duration: number;
  created_at: string;
  updated_at: string;
}): Scene => ({
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

function mapSceneHistoryRow(row: {
  id: string;
  scene_id: string;
  description: string;
  image_asset_id?: string | null;
  video_asset_id?: string | null;
  created_at: string;
}): SceneHistoryEntry {
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
