import { randomUUID } from "node:crypto";
import type { Database as SqliteDatabase } from "better-sqlite3";
import type { SceneGroup } from "../types";

export const createSceneGroup = (
  db: SqliteDatabase,
  projectId: string,
  name: string,
  color?: string
): SceneGroup => {
  const id = randomUUID();

  // Get max order index for this project
  const maxOrderRow = db
    .prepare<{ projectId: string }>(
      `SELECT COALESCE(MAX(order_index), -1) AS max_order FROM scene_groups WHERE project_id = @projectId`
    )
    .get({ projectId }) as { max_order: number };

  const orderIndex = maxOrderRow.max_order + 1;

  db.prepare<{
    id: string;
    projectId: string;
    name: string;
    color?: string | null;
    orderIndex: number;
  }>(
    `INSERT INTO scene_groups (id, project_id, name, color, order_index)
     VALUES (@id, @projectId, @name, @color, @orderIndex)`
  ).run({
    id,
    projectId,
    name,
    color: color ?? null,
    orderIndex,
  });

  const row = db
    .prepare(
      `SELECT id, project_id, name, color, order_index, created_at FROM scene_groups WHERE id = ?`
    )
    .get(id) as {
    id: string;
    project_id: string;
    name: string;
    color?: string | null;
    order_index: number;
    created_at: string;
  };

  return mapSceneGroupRow(row);
};

export const listSceneGroups = (
  db: SqliteDatabase,
  projectId: string
): SceneGroup[] => {
  const rows = db
    .prepare(
      `SELECT id, project_id, name, color, order_index, created_at
       FROM scene_groups
       WHERE project_id = ?
       ORDER BY order_index ASC`
    )
    .all(projectId) as Array<{
    id: string;
    project_id: string;
    name: string;
    color?: string | null;
    order_index: number;
    created_at: string;
  }>;

  return rows.map(mapSceneGroupRow);
};

export const updateSceneGroup = (
  db: SqliteDatabase,
  groupId: string,
  updates: { name?: string; color?: string }
): SceneGroup | null => {
  const fields: string[] = [];
  const params: Record<string, unknown> = { groupId };

  if (updates.name !== undefined) {
    fields.push("name = @name");
    params.name = updates.name;
  }

  if (updates.color !== undefined) {
    fields.push("color = @color");
    params.color = updates.color;
  }

  if (fields.length === 0) {
    const row = db
      .prepare(
        `SELECT id, project_id, name, color, order_index, created_at FROM scene_groups WHERE id = ?`
      )
      .get(groupId) as
      | {
          id: string;
          project_id: string;
          name: string;
          color?: string | null;
          order_index: number;
          created_at: string;
        }
      | undefined;
    return row ? mapSceneGroupRow(row) : null;
  }

  const sql = `UPDATE scene_groups SET ${fields.join(
    ", "
  )} WHERE id = @groupId`;
  const result = db.prepare(sql).run(params);

  if (result.changes === 0) {
    return null;
  }

  const row = db
    .prepare(
      `SELECT id, project_id, name, color, order_index, created_at FROM scene_groups WHERE id = ?`
    )
    .get(groupId) as
    | {
        id: string;
        project_id: string;
        name: string;
        color?: string | null;
        order_index: number;
        created_at: string;
      }
    | undefined;

  return row ? mapSceneGroupRow(row) : null;
};

export const deleteSceneGroup = (
  db: SqliteDatabase,
  groupId: string
): boolean => {
  const result = db
    .prepare(`DELETE FROM scene_groups WHERE id = ?`)
    .run(groupId);
  return result.changes > 0;
};

export const addScenesToGroup = (
  db: SqliteDatabase,
  groupId: string,
  sceneIds: string[]
): void => {
  const insertStmt = db.prepare<{
    sceneId: string;
    groupId: string;
  }>(
    `INSERT OR REPLACE INTO scene_group_members (scene_id, group_id)
     VALUES (@sceneId, @groupId)`
  );

  // Enforce single-group membership: remove existing group assignments
  const deleteStmt = db.prepare<{ sceneId: string }>(
    `DELETE FROM scene_group_members WHERE scene_id = @sceneId`
  );

  const transaction = db.transaction((ids: string[]) => {
    for (const sceneId of ids) {
      deleteStmt.run({ sceneId });
      insertStmt.run({ sceneId, groupId });
    }
  });

  transaction(sceneIds);
};

export const removeScenesFromGroup = (
  db: SqliteDatabase,
  groupId: string,
  sceneIds: string[]
): void => {
  const deleteStmt = db.prepare<{
    sceneId: string;
    groupId: string;
  }>(
    `DELETE FROM scene_group_members WHERE scene_id = @sceneId AND group_id = @groupId`
  );

  const transaction = db.transaction((ids: string[]) => {
    for (const sceneId of ids) {
      deleteStmt.run({ sceneId, groupId });
    }
  });

  transaction(sceneIds);
};

// Mappers

const mapSceneGroupRow = (row: {
  id: string;
  project_id: string;
  name: string;
  color?: string | null;
  order_index: number;
  created_at: string;
}): SceneGroup => ({
  id: row.id,
  projectId: row.project_id,
  name: row.name,
  color: row.color ?? null,
  orderIndex: row.order_index,
  createdAt: row.created_at,
});
