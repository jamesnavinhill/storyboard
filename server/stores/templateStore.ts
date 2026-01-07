import { randomUUID } from "node:crypto";
import type { Database as SqliteDatabase } from "better-sqlite3";
import { escapeSqlLikePattern } from "./storeUtils";

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

// ============================================================================
// Style Template CRUD Operations
// ============================================================================

export const createStyleTemplate = (
  db: SqliteDatabase,
  input: CreateStyleTemplateInput
): StyleTemplate => {
  const id = randomUUID();
  const stmt = db.prepare<{
    id: string;
    name: string;
    description: string | null;
    thumbnail: string | null;
    category: string | null;
    style_prompt: string;
    tested: number;
    examples: string | null;
    metadata: string | null;
  }>(
    `INSERT INTO style_templates (id, name, description, thumbnail, category, style_prompt, tested, examples, metadata)
     VALUES (@id, @name, @description, @thumbnail, @category, @style_prompt, @tested, @examples, @metadata)`
  );

  stmt.run({
    id,
    name: input.name,
    description: input.description ?? null,
    thumbnail: input.thumbnail ?? null,
    category: input.category ? JSON.stringify(input.category) : null,
    style_prompt: input.stylePrompt,
    tested: input.tested ? 1 : 0,
    examples: input.examples ? JSON.stringify(input.examples) : null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });

  const template = getStyleTemplateById(db, id);
  if (!template) {
    throw new Error("Failed to create style template");
  }
  return template;
};

export const listStyleTemplates = (
  db: SqliteDatabase,
  options: ListStyleTemplatesOptions = {}
): StyleTemplate[] => {
  let sql = `SELECT id, name, description, thumbnail, category, style_prompt, tested, examples, metadata, created_at, updated_at
             FROM style_templates
             WHERE 1=1`;
  const params: Record<string, unknown> = {};

  if (options.category) {
    // Search for category in JSON array
    sql += ` AND category LIKE @categoryPattern`;
    params.categoryPattern = `%"${options.category}"%`;
  }

  if (options.search) {
    const pattern = escapeSqlLikePattern(options.search);
    if (pattern) {
      sql += ` AND (lower(name) LIKE lower(@pattern) ESCAPE '\\' OR lower(COALESCE(description, '')) LIKE lower(@pattern) ESCAPE '\\')`;
      params.pattern = pattern;
    }
  }

  sql += ` ORDER BY created_at DESC`;

  const rows = db.prepare(sql).all(params) as Array<{
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
  }>;

  return rows.map(mapStyleTemplateRow);
};

export const getStyleTemplateById = (
  db: SqliteDatabase,
  id: string
): StyleTemplate | null => {
  const row = db
    .prepare(
      `SELECT id, name, description, thumbnail, category, style_prompt, tested, examples, metadata, created_at, updated_at
       FROM style_templates WHERE id = ?`
    )
    .get(id) as
    | {
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
    | undefined;

  return row ? mapStyleTemplateRow(row) : null;
};

export const updateStyleTemplate = (
  db: SqliteDatabase,
  id: string,
  updates: UpdateStyleTemplateInput
): StyleTemplate | null => {
  const fields: string[] = [];
  const params: Record<string, unknown> = { id };

  if (updates.name !== undefined) {
    fields.push("name = @name");
    params.name = updates.name;
  }

  if (updates.description !== undefined) {
    fields.push("description = @description");
    params.description = updates.description ?? null;
  }

  if (updates.thumbnail !== undefined) {
    fields.push("thumbnail = @thumbnail");
    params.thumbnail = updates.thumbnail ?? null;
  }

  if (updates.category !== undefined) {
    fields.push("category = @category");
    params.category = updates.category ? JSON.stringify(updates.category) : null;
  }

  if (updates.stylePrompt !== undefined) {
    fields.push("style_prompt = @style_prompt");
    params.style_prompt = updates.stylePrompt;
  }

  if (updates.tested !== undefined) {
    fields.push("tested = @tested");
    params.tested = updates.tested ? 1 : 0;
  }

  if (updates.examples !== undefined) {
    fields.push("examples = @examples");
    params.examples = updates.examples ? JSON.stringify(updates.examples) : null;
  }

  if (updates.metadata !== undefined) {
    fields.push("metadata = @metadata");
    params.metadata = updates.metadata ? JSON.stringify(updates.metadata) : null;
  }

  if (fields.length === 0) {
    return getStyleTemplateById(db, id);
  }

  fields.push("updated_at = datetime('now')");

  const sql = `UPDATE style_templates SET ${fields.join(", ")} WHERE id = @id`;
  const result = db.prepare(sql).run(params);

  if (result.changes === 0) {
    return null;
  }

  return getStyleTemplateById(db, id);
};

export const deleteStyleTemplate = (
  db: SqliteDatabase,
  id: string
): boolean => {
  const result = db.prepare(`DELETE FROM style_templates WHERE id = ?`).run(id);
  return result.changes > 0;
};

// ============================================================================
// Mappers
// ============================================================================

const mapStyleTemplateRow = (row: {
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
}): StyleTemplate => ({
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
