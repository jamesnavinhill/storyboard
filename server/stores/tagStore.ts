import { randomUUID } from "node:crypto";
import type { UnifiedDatabase, DatabaseRow } from "../database";
import type { SceneTag } from "../types";

interface SceneTagRow extends DatabaseRow {
  id: string;
  project_id: string;
  name: string;
  color: string | null;
}

const mapSceneTagRow = (row: SceneTagRow): SceneTag => ({
  id: row.id,
  projectId: row.project_id,
  name: row.name,
  color: row.color ?? null,
});

export const createSceneTag = async (
  db: UnifiedDatabase,
  projectId: string,
  name: string,
  color?: string
): Promise<SceneTag> => {
  const id = randomUUID();

  await db.execute(
    `INSERT INTO scene_tags (id, project_id, name, color)
     VALUES (?, ?, ?, ?)`,
    [id, projectId, name, color ?? null]
  );

  const row = await db.queryOne<SceneTagRow>(
    `SELECT id, project_id, name, color FROM scene_tags WHERE id = ?`,
    [id]
  );

  if (!row) {
    throw new Error("Failed to create scene tag");
  }

  return mapSceneTagRow(row);
};

export const listSceneTags = async (
  db: UnifiedDatabase,
  projectId: string
): Promise<SceneTag[]> => {
  const result = await db.query<SceneTagRow>(
    `SELECT id, project_id, name, color
     FROM scene_tags
     WHERE project_id = ?
     ORDER BY name ASC`,
    [projectId]
  );

  return result.rows.map(mapSceneTagRow);
};

export const deleteSceneTag = async (
  db: UnifiedDatabase,
  tagId: string
): Promise<boolean> => {
  const result = await db.execute(`DELETE FROM scene_tags WHERE id = ?`, [tagId]);
  return result.changes > 0;
};

export const assignTagsToScene = async (
  db: UnifiedDatabase,
  sceneId: string,
  tagIds: string[]
): Promise<void> => {
  for (const tagId of tagIds) {
    await db.execute(
      `INSERT OR IGNORE INTO scene_tag_assignments (scene_id, tag_id)
       VALUES (?, ?)`,
      [sceneId, tagId]
    );
  }
};

export const removeTagsFromScene = async (
  db: UnifiedDatabase,
  sceneId: string,
  tagIds: string[]
): Promise<void> => {
  for (const tagId of tagIds) {
    await db.execute(
      `DELETE FROM scene_tag_assignments WHERE scene_id = ? AND tag_id = ?`,
      [sceneId, tagId]
    );
  }
};
