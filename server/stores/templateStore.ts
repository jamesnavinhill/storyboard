/**
 * Async Template Store
 *
 * Provides async database operations for style templates.
 * This is the async version for use with Turso/libSQL and PostgreSQL on Vercel.
 */

import { randomUUID } from "node:crypto";
import type { UnifiedDatabase, DatabaseRow } from "../database";
import { escapeSqlLikePattern } from "./storeUtils";
import { DEFAULT_TEMPLATES } from "../data/defaults";

export interface StyleTemplate {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  category: string[] | null;
  stylePrompt: string;
  tested: boolean;
  examples: string[] | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateStyleTemplateInput {
  name: string;
  description?: string;
  thumbnail?: string;
  category?: string[];
  stylePrompt: string;
  tested?: boolean;
  examples?: string[];
  metadata?: Record<string, unknown>;
}

interface UpdateStyleTemplateInput {
  name?: string;
  description?: string;
  thumbnail?: string;
  category?: string[];
  stylePrompt?: string;
  tested?: boolean;
  examples?: string[];
  metadata?: Record<string, unknown>;
}

interface ListStyleTemplatesOptions {
  category?: string;
  search?: string;
}

interface StyleTemplateRow extends DatabaseRow {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  category: string | null;
  style_prompt: string;
  tested: number;
  examples: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Mappers
// ============================================================================

const mapStyleTemplateRow = (row: StyleTemplateRow): StyleTemplate => ({
  id: row.id,
  name: row.name,
  description: row.description,
  thumbnail: row.thumbnail,
  category: row.category ? JSON.parse(row.category) : null,
  stylePrompt: row.style_prompt,
  tested: row.tested === 1,
  examples: row.examples ? JSON.parse(row.examples) : null,
  metadata: row.metadata ? JSON.parse(row.metadata) : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ============================================================================
// Style Template CRUD Operations
// ============================================================================

export const createStyleTemplate = async (
  db: UnifiedDatabase,
  input: CreateStyleTemplateInput
): Promise<StyleTemplate> => {
  const id = randomUUID();

  await db.execute(
    `INSERT INTO style_templates (id, name, description, thumbnail, category, style_prompt, tested, examples, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.description ?? null,
      input.thumbnail ?? null,
      input.category ? JSON.stringify(input.category) : null,
      input.stylePrompt,
      input.tested ? 1 : 0,
      input.examples ? JSON.stringify(input.examples) : null,
      input.metadata ? JSON.stringify(input.metadata) : null,
    ]
  );

  const template = await getStyleTemplateById(db, id);
  if (!template) {
    throw new Error("Failed to create style template");
  }
  return template;
};

export const listStyleTemplates = async (
  db: UnifiedDatabase,
  options: ListStyleTemplatesOptions = {}
): Promise<StyleTemplate[]> => {
  let sql = `SELECT id, name, description, thumbnail, category, style_prompt, tested, examples, metadata, created_at, updated_at
             FROM style_templates
             WHERE 1=1`;
  const params: unknown[] = [];

  if (options.category) {
    sql += ` AND category LIKE ?`;
    params.push(`%"${options.category}"%`);
  }

  if (options.search) {
    const pattern = escapeSqlLikePattern(options.search);
    if (pattern) {
      sql += ` AND (lower(name) LIKE lower(?) ESCAPE '\\' OR lower(COALESCE(description, '')) LIKE lower(?) ESCAPE '\\')`;
      params.push(pattern, pattern);
    }
  }

  sql += ` ORDER BY created_at DESC`;

  try {
    const result = await db.query<StyleTemplateRow>(sql, params);

    // Fallback: If no templates found and no search, return defaults
    if (result.rows.length === 0 && !options.search && (!options.category || options.category.length === 0)) {
      const now = new Date().toISOString();
      return DEFAULT_TEMPLATES.map((t) => ({
        id: "default-" + t.name.toLowerCase().replace(/\s+/g, "-"),
        ...t,
        description: t.description || null,
        thumbnail: null,
        examples: null,
        metadata: null,
        category: t.category || null,
        createdAt: now,
        updatedAt: now,
      }));
    }

    return result.rows.map(mapStyleTemplateRow);
  } catch (error) {
    // If table doesn't exist (migration failed), return defaults
    if (!options.search && (!options.category || options.category.length === 0)) {
      const now = new Date().toISOString();
      return DEFAULT_TEMPLATES.map((t) => ({
        id: "default-" + t.name.toLowerCase().replace(/\s+/g, "-"),
        ...t,
        description: t.description || null,
        thumbnail: null,
        examples: null,
        metadata: null,
        category: t.category || null,
        createdAt: now,
        updatedAt: now,
      }));
    }
    return [];
  }
};

export const getStyleTemplateById = async (
  db: UnifiedDatabase,
  id: string
): Promise<StyleTemplate | null> => {
  const row = await db.queryOne<StyleTemplateRow>(
    `SELECT id, name, description, thumbnail, category, style_prompt, tested, examples, metadata, created_at, updated_at
     FROM style_templates WHERE id = ?`,
    [id]
  );

  return row ? mapStyleTemplateRow(row) : null;
};

export const updateStyleTemplate = async (
  db: UnifiedDatabase,
  id: string,
  updates: UpdateStyleTemplateInput
): Promise<StyleTemplate | null> => {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (updates.name !== undefined) {
    fields.push("name = ?");
    params.push(updates.name);
  }

  if (updates.description !== undefined) {
    fields.push("description = ?");
    params.push(updates.description ?? null);
  }

  if (updates.thumbnail !== undefined) {
    fields.push("thumbnail = ?");
    params.push(updates.thumbnail ?? null);
  }

  if (updates.category !== undefined) {
    fields.push("category = ?");
    params.push(updates.category ? JSON.stringify(updates.category) : null);
  }

  if (updates.stylePrompt !== undefined) {
    fields.push("style_prompt = ?");
    params.push(updates.stylePrompt);
  }

  if (updates.tested !== undefined) {
    fields.push("tested = ?");
    params.push(updates.tested ? 1 : 0);
  }

  if (updates.examples !== undefined) {
    fields.push("examples = ?");
    params.push(updates.examples ? JSON.stringify(updates.examples) : null);
  }

  if (updates.metadata !== undefined) {
    fields.push("metadata = ?");
    params.push(updates.metadata ? JSON.stringify(updates.metadata) : null);
  }

  if (fields.length === 0) {
    return getStyleTemplateById(db, id);
  }

  fields.push("updated_at = datetime('now')");
  params.push(id);

  const sql = `UPDATE style_templates SET ${fields.join(", ")} WHERE id = ?`;
  const result = await db.execute(sql, params);

  if (result.changes === 0) {
    return null;
  }

  return getStyleTemplateById(db, id);
};

export const deleteStyleTemplate = async (
  db: UnifiedDatabase,
  id: string
): Promise<boolean> => {
  const result = await db.execute(`DELETE FROM style_templates WHERE id = ?`, [
    id,
  ]);
  return result.changes > 0;
};
