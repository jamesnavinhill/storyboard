/**
 * Async Project Store
 *
 * Provides async database operations for projects.
 * This is the async version of projectStore.ts for use with
 * Turso/libSQL and PostgreSQL on Vercel.
 */

import { randomUUID } from "node:crypto";
import type { UnifiedDatabase, DatabaseRow } from "../database";
import type { Project, SettingsRecord } from "../types";

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

const normalizeProjectName = (name: string): string => {
    return name.trim().slice(0, 255) || "Untitled Project";
};

const toSqlOrder = (order?: ProjectSortOrder): "ASC" | "DESC" => {
    return order === "asc" ? "ASC" : "DESC";
};

const escapeSqlLikePattern = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return "";
    const escaped = trimmed.replace(/[\\%_]/g, "\\$&");
    return `%${escaped}%`;
};

interface ProjectRow extends DatabaseRow {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

const mapProjectRow = (row: ProjectRow): Project => ({
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

// ============================================================================
// Project CRUD Operations
// ============================================================================

export const createProject = async (
    db: UnifiedDatabase,
    input: CreateProjectInput
): Promise<Project> => {
    const id = randomUUID();
    const name = normalizeProjectName(input.name);

    await db.execute(
        `INSERT INTO projects (id, name, description) VALUES (?, ?, ?)`,
        [id, name, input.description ?? null]
    );

    const row = await db.queryOne<ProjectRow>(
        `SELECT id, name, description, created_at, updated_at FROM projects WHERE id = ?`,
        [id]
    );

    if (!row) {
        throw new Error("Failed to create project");
    }

    return mapProjectRow(row);
};

export const listProjects = async (
    db: UnifiedDatabase,
    options: ListProjectsOptions = {}
): Promise<Project[]> => {
    const sortField = options.sort ?? "updatedAt";
    const sortColumn = sortColumnByField[sortField];
    const sortDirection = toSqlOrder(options.order);

    const result = await db.query<ProjectRow>(
        `SELECT id, name, description, created_at, updated_at
         FROM projects
         ORDER BY ${sortColumn} ${sortDirection}, id ASC`
    );

    return result.rows.map(mapProjectRow);
};

export const getProjectById = async (
    db: UnifiedDatabase,
    id: string
): Promise<Project | null> => {
    const row = await db.queryOne<ProjectRow>(
        `SELECT id, name, description, created_at, updated_at FROM projects WHERE id = ?`,
        [id]
    );

    return row ? mapProjectRow(row) : null;
};

export const updateProject = async (
    db: UnifiedDatabase,
    projectId: string,
    updates: { name?: string; description?: string | null }
): Promise<Project | null> => {
    const fields: string[] = [];
    const params: unknown[] = [];

    if (updates.name !== undefined) {
        fields.push("name = ?");
        params.push(normalizeProjectName(updates.name));
    }

    if (updates.description !== undefined) {
        fields.push("description = ?");
        params.push(updates.description ?? null);
    }

    if (fields.length === 0) {
        return getProjectById(db, projectId);
    }

    params.push(projectId);
    const sql = `UPDATE projects SET ${fields.join(", ")} WHERE id = ?`;
    const result = await db.execute(sql, params);

    if (result.changes === 0) {
        return null;
    }

    return getProjectById(db, projectId);
};

export const deleteProject = async (
    db: UnifiedDatabase,
    projectId: string
): Promise<boolean> => {
    const result = await db.execute(`DELETE FROM projects WHERE id = ?`, [
        projectId,
    ]);
    return result.changes > 0;
};

export const countProjects = async (db: UnifiedDatabase): Promise<number> => {
    const row = await db.queryOne<{ total: number }>(
        `SELECT COUNT(*) AS total FROM projects`
    );
    return row?.total ?? 0;
};

export const searchProjects = async (
    db: UnifiedDatabase,
    query: string,
    options: ListProjectsOptions = {}
): Promise<Project[]> => {
    const pattern = escapeSqlLikePattern(query);
    if (!pattern) {
        return [];
    }

    const sortField = options.sort ?? "updatedAt";
    const sortColumn = sortColumnByField[sortField];
    const sortDirection = toSqlOrder(options.order);

    const result = await db.query<ProjectRow>(
        `SELECT id, name, description, created_at, updated_at
         FROM projects
         WHERE lower(name) LIKE lower(?) ESCAPE '\\'
            OR lower(COALESCE(description, '')) LIKE lower(?) ESCAPE '\\'
         ORDER BY ${sortColumn} ${sortDirection}, id ASC`,
        [pattern, pattern]
    );

    return result.rows.map(mapProjectRow);
};

// ============================================================================
// Settings Operations
// ============================================================================

export const upsertSettings = async (
    db: UnifiedDatabase,
    projectId: string,
    data: unknown
): Promise<SettingsRecord> => {
    const json = JSON.stringify(data ?? {});

    await db.execute(
        `INSERT INTO settings (project_id, data) VALUES (?, ?)
         ON CONFLICT(project_id) DO UPDATE SET data = excluded.data`,
        [projectId, json]
    );

    const row = await db.queryOne<{
        project_id: string;
        data: string;
        updated_at: string;
    }>(
        `SELECT project_id, data, updated_at FROM settings WHERE project_id = ?`,
        [projectId]
    );

    if (!row) {
        throw new Error("Failed to upsert settings");
    }

    return {
        projectId: row.project_id,
        data: JSON.parse(row.data ?? "{}"),
        updatedAt: row.updated_at,
    };
};

export const getSettings = async (
    db: UnifiedDatabase,
    projectId: string
): Promise<SettingsRecord | null> => {
    const row = await db.queryOne<{
        project_id: string;
        data: string;
        updated_at: string;
    }>(
        `SELECT project_id, data, updated_at FROM settings WHERE project_id = ?`,
        [projectId]
    );

    if (!row) {
        return null;
    }

    return {
        projectId: row.project_id,
        data: JSON.parse(row.data ?? "{}"),
        updatedAt: row.updated_at,
    };
};
