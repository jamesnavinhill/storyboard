import { randomUUID } from "node:crypto";
import type { Database as SqliteDatabase } from "better-sqlite3";
import type {
  Project,
  Scene,
  ChatMessage,
  SettingsRecord,
  SceneGroup,
  SceneTag,
  SceneHistoryEntry,
} from "../types";

// Import store slices
import * as sceneStore from "./sceneStore";
import * as groupStore from "./groupStore";
import * as tagStore from "./tagStore";
import * as chatStore from "./chatStore";
import { normalizeProjectName, toSqlOrder, escapeSqlLikePattern } from "./storeUtils";

interface CreateProjectInput {
  name: string;
  description?: string;
}

export type ProjectSortField = "name" | "createdAt" | "updatedAt";
export type ProjectSortOrder = "asc" | "desc";

interface ListProjectsOptions {
  sort?: ProjectSortField;
  order?: ProjectSortOrder;
}

const sortColumnByField: Record<ProjectSortField, string> = {
  name: "name",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

// ============================================================================
// Project CRUD Operations
// ============================================================================

export const createProject = (
  db: SqliteDatabase,
  input: CreateProjectInput
): Project => {
  const id = randomUUID();
  const name = normalizeProjectName(input.name);
  const stmt = db.prepare<{
    id: string;
    name: string;
    description?: string | null;
  }>(
    `INSERT INTO projects (id, name, description) VALUES (@id, @name, @description)`
  );
  stmt.run({
    id,
    name,
    description: input.description ?? null,
  });
  const row = db
    .prepare(
      `SELECT id, name, description, created_at, updated_at FROM projects WHERE id = ?`
    )
    .get(id) as {
    id: string;
    name: string;
    description?: string | null;
    created_at: string;
    updated_at: string;
  };
  return mapProjectRow(row);
};

export const listProjects = (
  db: SqliteDatabase,
  options: ListProjectsOptions = {}
): Project[] => {
  const sortField = options.sort ?? "updatedAt";
  const sortColumn = sortColumnByField[sortField];
  const sortDirection = toSqlOrder(options.order);
  const rows = db
    .prepare(
      `SELECT id, name, description, created_at, updated_at
       FROM projects
       ORDER BY ${sortColumn} ${sortDirection}, id ASC`
    )
    .all() as Array<{
    id: string;
    name: string;
    description?: string | null;
    created_at: string;
    updated_at: string;
  }>;
  return rows.map(mapProjectRow);
};

export const getProjectById = (
  db: SqliteDatabase,
  id: string
): Project | null => {
  const row = db
    .prepare(
      `SELECT id, name, description, created_at, updated_at FROM projects WHERE id = ?`
    )
    .get(id) as
    | {
        id: string;
        name: string;
        description?: string | null;
        created_at: string;
        updated_at: string;
      }
    | undefined;
  return row ? mapProjectRow(row) : null;
};

export const updateProject = (
  db: SqliteDatabase,
  projectId: string,
  updates: { name?: string; description?: string | null }
): Project | null => {
  const fields: string[] = [];
  const params: Record<string, unknown> = { projectId };

  if (updates.name !== undefined) {
    fields.push("name = @name");
    params.name = normalizeProjectName(updates.name);
  }

  if (updates.description !== undefined) {
    fields.push("description = @description");
    params.description = updates.description ?? null;
  }

  if (fields.length === 0) {
    return getProjectById(db, projectId);
  }

  const sql = `UPDATE projects SET ${fields.join(", ")} WHERE id = @projectId`;
  const result = db.prepare(sql).run(params);
  if (result.changes === 0) {
    return null;
  }

  return getProjectById(db, projectId);
};

export const deleteProject = (
  db: SqliteDatabase,
  projectId: string
): boolean => {
  const result = db.prepare(`DELETE FROM projects WHERE id = ?`).run(projectId);
  return result.changes > 0;
};

export const countProjects = (db: SqliteDatabase): number => {
  const row = db.prepare(`SELECT COUNT(*) AS total FROM projects`).get() as
    | { total: number }
    | undefined;
  return row?.total ?? 0;
};

export const searchProjects = (
  db: SqliteDatabase,
  query: string,
  options: ListProjectsOptions = {}
): Project[] => {
  const pattern = escapeSqlLikePattern(query);
  if (!pattern) {
    return [];
  }

  const sortField = options.sort ?? "updatedAt";
  const sortColumn = sortColumnByField[sortField];
  const sortDirection = toSqlOrder(options.order);

  const rows = db
    .prepare(
      `SELECT id, name, description, created_at, updated_at
       FROM projects
       WHERE lower(name) LIKE lower(@pattern) ESCAPE '\\'
          OR lower(COALESCE(description, '')) LIKE lower(@pattern) ESCAPE '\\'
       ORDER BY ${sortColumn} ${sortDirection}, id ASC`
    )
    .all({ pattern }) as Array<{
    id: string;
    name: string;
    description?: string | null;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map(mapProjectRow);
};

// ============================================================================
// Scene Operations - Delegated to sceneStore
// ============================================================================

export const getScenesByProject = sceneStore.getScenesByProject;
export const createScenes = sceneStore.createScenes;
export const updateScene = sceneStore.updateScene;
export const getSceneById = sceneStore.getSceneById;
export const reorderScenes = sceneStore.reorderScenes;
export const deleteScene = sceneStore.deleteScene;
export const getSceneHistory = sceneStore.getSceneHistory;
export const restoreSceneFromHistory = sceneStore.restoreSceneFromHistory;
export const getScenesWithGroups = sceneStore.getScenesWithGroups;
export const getScenesWithTags = sceneStore.getScenesWithTags;

// ============================================================================
// Group Operations - Delegated to groupStore
// ============================================================================

export const createSceneGroup = groupStore.createSceneGroup;
export const listSceneGroups = groupStore.listSceneGroups;
export const updateSceneGroup = groupStore.updateSceneGroup;
export const deleteSceneGroup = groupStore.deleteSceneGroup;
export const addScenesToGroup = groupStore.addScenesToGroup;
export const removeScenesFromGroup = groupStore.removeScenesFromGroup;

// ============================================================================
// Tag Operations - Delegated to tagStore
// ============================================================================

export const createSceneTag = tagStore.createSceneTag;
export const listSceneTags = tagStore.listSceneTags;
export const deleteSceneTag = tagStore.deleteSceneTag;
export const assignTagsToScene = tagStore.assignTagsToScene;
export const removeTagsFromScene = tagStore.removeTagsFromScene;

// ============================================================================
// Chat Operations - Delegated to chatStore
// ============================================================================

export const appendChatMessage = chatStore.appendChatMessage;
export const getChatMessages = chatStore.getChatMessages;

// ============================================================================
// Settings Operations
// ============================================================================

export const upsertSettings = (
  db: SqliteDatabase,
  projectId: string,
  data: unknown
): SettingsRecord => {
  const json = JSON.stringify(data ?? {});
  db.prepare<{
    projectId: string;
    data: string;
  }>(
    `INSERT INTO settings (project_id, data) VALUES (@projectId, @data)
     ON CONFLICT(project_id) DO UPDATE SET data = excluded.data`
  ).run({ projectId, data: json });

  const row = db
    .prepare(
      `SELECT project_id, data, updated_at FROM settings WHERE project_id = ?`
    )
    .get(projectId) as {
    project_id: string;
    data: string;
    updated_at: string;
  };
  return {
    projectId: row.project_id,
    data: JSON.parse(row.data ?? "{}"),
    updatedAt: row.updated_at,
  };
};

export const getSettings = (
  db: SqliteDatabase,
  projectId: string
): SettingsRecord | null => {
  const row = db
    .prepare(
      `SELECT project_id, data, updated_at FROM settings WHERE project_id = ?`
    )
    .get(projectId) as
    | {
        project_id: string;
        data: string;
        updated_at: string;
      }
    | undefined;
  if (!row) {
    return null;
  }
  return {
    projectId: row.project_id,
    data: JSON.parse(row.data ?? "{}"),
    updatedAt: row.updated_at,
  };
};

// ============================================================================
// Mappers
// ============================================================================

const mapProjectRow = (row: {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}): Project => ({
  id: row.id,
  name: row.name,
  description: row.description ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
