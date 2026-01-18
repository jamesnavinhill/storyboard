/**
 * Async Group Store
 *
 * Provides async database operations for scene groups.
 */

import { randomUUID } from "node:crypto";
import type { UnifiedDatabase, DatabaseRow } from "../database";
import type { SceneGroup } from "../types";

interface SceneGroupRow extends DatabaseRow {
  id: string;
  project_id: string;
  name: string;
  color: string | null;
  order_index: number;
  created_at: string;
}

const mapSceneGroupRow = (row: SceneGroupRow): SceneGroup => ({
  id: row.id,
  projectId: row.project_id,
  name: row.name,
  color: row.color ?? null,
  orderIndex: row.order_index,
  createdAt: row.created_at,
});

export const createSceneGroup = async (
  db: UnifiedDatabase,
  projectId: string,
  name: string,
  color?: string
): Promise<SceneGroup> => {
  const id = randomUUID();

  // Get max order index for this project
  const maxOrderRow = await db.queryOne<{ max_order: number }>(
    `SELECT COALESCE(MAX(order_index), -1) AS max_order FROM scene_groups WHERE project_id = ?`,
    [projectId]
  );

  const orderIndex = (maxOrderRow?.max_order ?? -1) + 1;

  await db.execute(
    `INSERT INTO scene_groups (id, project_id, name, color, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [id, projectId, name, color ?? null, orderIndex]
  );

  const row = await db.queryOne<SceneGroupRow>(
    `SELECT id, project_id, name, color, order_index, created_at FROM scene_groups WHERE id = ?`,
    [id]
  );

  if (!row) {
    throw new Error("Failed to create scene group");
  }

  return mapSceneGroupRow(row);
};

export const listSceneGroups = async (
  db: UnifiedDatabase,
  projectId: string
): Promise<SceneGroup[]> => {
  const result = await db.query<SceneGroupRow>(
    `SELECT id, project_id, name, color, order_index, created_at
     FROM scene_groups
     WHERE project_id = ?
     ORDER BY order_index ASC`,
    [projectId]
  );

  return result.rows.map(mapSceneGroupRow);
};

export const updateSceneGroup = async (
  db: UnifiedDatabase,
  groupId: string,
  updates: { name?: string; color?: string }
): Promise<SceneGroup | null> => {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (updates.name !== undefined) {
    fields.push("name = ?");
    params.push(updates.name);
  }

  if (updates.color !== undefined) {
    fields.push("color = ?");
    params.push(updates.color);
  }

  if (fields.length === 0) {
    const row = await db.queryOne<SceneGroupRow>(
      `SELECT id, project_id, name, color, order_index, created_at FROM scene_groups WHERE id = ?`,
      [groupId]
    );
    return row ? mapSceneGroupRow(row) : null;
  }

  params.push(groupId);
  const sql = `UPDATE scene_groups SET ${fields.join(", ")} WHERE id = ?`;
  const result = await db.execute(sql, params);

  if (result.changes === 0) {
    return null;
  }

  const row = await db.queryOne<SceneGroupRow>(
    `SELECT id, project_id, name, color, order_index, created_at FROM scene_groups WHERE id = ?`,
    [groupId]
  );

  return row ? mapSceneGroupRow(row) : null;
};

export const deleteSceneGroup = async (
  db: UnifiedDatabase,
  groupId: string
): Promise<boolean> => {
  const result = await db.execute(`DELETE FROM scene_groups WHERE id = ?`, [
    groupId,
  ]);
  return result.changes > 0;
};

export const addScenesToGroup = async (
  db: UnifiedDatabase,
  groupId: string,
  sceneIds: string[]
): Promise<void> => {
  // Enforce single-group membership: remove existing group assignments, then insert
  for (const sceneId of sceneIds) {
    await db.execute(
      `DELETE FROM scene_group_members WHERE scene_id = ?`,
      [sceneId]
    );
    await db.execute(
      `INSERT OR REPLACE INTO scene_group_members (scene_id, group_id) VALUES (?, ?)`,
      [sceneId, groupId]
    );
  }
};

export const removeScenesFromGroup = async (
  db: UnifiedDatabase,
  groupId: string,
  sceneIds: string[]
): Promise<void> => {
  for (const sceneId of sceneIds) {
    await db.execute(
      `DELETE FROM scene_group_members WHERE scene_id = ? AND group_id = ?`,
      [sceneId, groupId]
    );
  }
};
