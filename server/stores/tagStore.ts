import { randomUUID } from "node:crypto";
import type { Database as SqliteDatabase } from "better-sqlite3";
import type { SceneTag } from "../types";

export const createSceneTag = (
  db: SqliteDatabase,
  projectId: string,
  name: string,
  color?: string
): SceneTag => {
  const id = randomUUID();

  db.prepare<{
    id: string;
    projectId: string;
    name: string;
    color?: string | null;
  }>(
    `INSERT INTO scene_tags (id, project_id, name, color)
     VALUES (@id, @projectId, @name, @color)`
  ).run({
    id,
    projectId,
    name,
    color: color ?? null,
  });

  const row = db
    .prepare(`SELECT id, project_id, name, color FROM scene_tags WHERE id = ?`)
    .get(id) as {
    id: string;
    project_id: string;
    name: string;
    color?: string | null;
  };

  return mapSceneTagRow(row);
};

export const listSceneTags = (
  db: SqliteDatabase,
  projectId: string
): SceneTag[] => {
  const rows = db
    .prepare(
      `SELECT id, project_id, name, color
       FROM scene_tags
       WHERE project_id = ?
       ORDER BY name ASC`
    )
    .all(projectId) as Array<{
    id: string;
    project_id: string;
    name: string;
    color?: string | null;
  }>;

  return rows.map(mapSceneTagRow);
};

export const deleteSceneTag = (db: SqliteDatabase, tagId: string): boolean => {
  const result = db.prepare(`DELETE FROM scene_tags WHERE id = ?`).run(tagId);
  return result.changes > 0;
};

export const assignTagsToScene = (
  db: SqliteDatabase,
  sceneId: string,
  tagIds: string[]
): void => {
  const insertStmt = db.prepare<{
    sceneId: string;
    tagId: string;
  }>(
    `INSERT OR IGNORE INTO scene_tag_assignments (scene_id, tag_id)
     VALUES (@sceneId, @tagId)`
  );

  const transaction = db.transaction((ids: string[]) => {
    for (const tagId of ids) {
      insertStmt.run({ sceneId, tagId });
    }
  });

  transaction(tagIds);
};

export const removeTagsFromScene = (
  db: SqliteDatabase,
  sceneId: string,
  tagIds: string[]
): void => {
  const deleteStmt = db.prepare<{
    sceneId: string;
    tagId: string;
  }>(
    `DELETE FROM scene_tag_assignments WHERE scene_id = @sceneId AND tag_id = @tagId`
  );

  const transaction = db.transaction((ids: string[]) => {
    for (const tagId of ids) {
      deleteStmt.run({ sceneId, tagId });
    }
  });

  transaction(tagIds);
};

// Mappers

const mapSceneTagRow = (row: {
  id: string;
  project_id: string;
  name: string;
  color?: string | null;
}): SceneTag => ({
  id: row.id,
  projectId: row.project_id,
  name: row.name,
  color: row.color ?? null,
});
