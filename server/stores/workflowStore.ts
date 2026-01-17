import { randomUUID } from "node:crypto";
import type { Database as SqliteDatabase } from "better-sqlite3";
import { escapeSqlLikePattern, toSqlOrder } from "./storeUtils";

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  category:
    | "music-video"
    | "commercial"
    | "social"
    | "explainer"
    | "custom"
    | "concept-art";
  systemInstruction: string;
  artStyle: string | null;
  examples: string[] | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowSubtype {
  id: string;
  workflowId: string;
  name: string;
  description: string | null;
  instructionModifier: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateWorkflowInput {
  name: string;
  description?: string;
  thumbnail?: string;
  category:
    | "music-video"
    | "commercial"
    | "social"
    | "explainer"
    | "custom"
    | "concept-art";
  systemInstruction: string;
  artStyle?: string;
  examples?: string[];
  metadata?: Record<string, unknown>;
}

interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  thumbnail?: string;
  category?:
    | "music-video"
    | "commercial"
    | "social"
    | "explainer"
    | "custom"
    | "concept-art";
  systemInstruction?: string;
  artStyle?: string;
  examples?: string[];
  metadata?: Record<string, unknown>;
}

interface CreateWorkflowSubtypeInput {
  name: string;
  description?: string;
  instructionModifier: string;
}

interface UpdateWorkflowSubtypeInput {
  name?: string;
  description?: string;
  instructionModifier?: string;
}

interface ListWorkflowsOptions {
  category?: string;
  search?: string;
}

// ============================================================================
// Workflow CRUD Operations
// ============================================================================

export const createWorkflow = (
  db: SqliteDatabase,
  input: CreateWorkflowInput
): Workflow => {
  const id = randomUUID();
  const stmt = db.prepare<{
    id: string;
    name: string;
    description: string | null;
    thumbnail: string | null;
    category: string;
    system_instruction: string;
    art_style: string | null;
    examples: string | null;
    metadata: string | null;
  }>(
    `INSERT INTO workflows (id, name, description, thumbnail, category, system_instruction, art_style, examples, metadata)
     VALUES (@id, @name, @description, @thumbnail, @category, @system_instruction, @art_style, @examples, @metadata)`
  );

  stmt.run({
    id,
    name: input.name,
    description: input.description ?? null,
    thumbnail: input.thumbnail ?? null,
    category: input.category,
    system_instruction: input.systemInstruction,
    art_style: input.artStyle ?? null,
    examples: input.examples ? JSON.stringify(input.examples) : null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });

  const workflow = getWorkflowById(db, id);
  if (!workflow) {
    throw new Error("Failed to create workflow");
  }
  return workflow;
};

export const listWorkflows = (
  db: SqliteDatabase,
  options: ListWorkflowsOptions = {}
): Workflow[] => {
  let sql = `SELECT id, name, description, thumbnail, category, system_instruction, art_style, examples, metadata, created_at, updated_at
             FROM workflows
             WHERE 1=1`;
  const params: Record<string, unknown> = {};

  if (options.category) {
    sql += ` AND category = @category`;
    params.category = options.category;
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
    category: string;
    system_instruction: string;
    art_style: string | null;
    examples: string | null;
    metadata: string | null;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map(mapWorkflowRow);
};

export const getWorkflowById = (
  db: SqliteDatabase,
  id: string
): Workflow | null => {
  const row = db
    .prepare(
      `SELECT id, name, description, thumbnail, category, system_instruction, art_style, examples, metadata, created_at, updated_at
       FROM workflows WHERE id = ?`
    )
    .get(id) as
    | {
        id: string;
        name: string;
        description: string | null;
        thumbnail: string | null;
        category: string;
        system_instruction: string;
        art_style: string | null;
        examples: string | null;
        metadata: string | null;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  return row ? mapWorkflowRow(row) : null;
};

export const updateWorkflow = (
  db: SqliteDatabase,
  id: string,
  updates: UpdateWorkflowInput
): Workflow | null => {
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
    params.category = updates.category;
  }

  if (updates.systemInstruction !== undefined) {
    fields.push("system_instruction = @system_instruction");
    params.system_instruction = updates.systemInstruction;
  }

  if (updates.artStyle !== undefined) {
    fields.push("art_style = @art_style");
    params.art_style = updates.artStyle ?? null;
  }

  if (updates.examples !== undefined) {
    fields.push("examples = @examples");
    params.examples = updates.examples
      ? JSON.stringify(updates.examples)
      : null;
  }

  if (updates.metadata !== undefined) {
    fields.push("metadata = @metadata");
    params.metadata = updates.metadata
      ? JSON.stringify(updates.metadata)
      : null;
  }

  if (fields.length === 0) {
    return getWorkflowById(db, id);
  }

  fields.push("updated_at = datetime('now')");

  const sql = `UPDATE workflows SET ${fields.join(", ")} WHERE id = @id`;
  const result = db.prepare(sql).run(params);

  if (result.changes === 0) {
    return null;
  }

  return getWorkflowById(db, id);
};

export const deleteWorkflow = (db: SqliteDatabase, id: string): boolean => {
  const result = db.prepare(`DELETE FROM workflows WHERE id = ?`).run(id);
  return result.changes > 0;
};

// ============================================================================
// Workflow Subtype CRUD Operations
// ============================================================================

export const createWorkflowSubtype = (
  db: SqliteDatabase,
  workflowId: string,
  input: CreateWorkflowSubtypeInput
): WorkflowSubtype => {
  const id = randomUUID();
  const stmt = db.prepare<{
    id: string;
    workflow_id: string;
    name: string;
    description: string | null;
    instruction_modifier: string;
  }>(
    `INSERT INTO workflow_subtypes (id, workflow_id, name, description, instruction_modifier)
     VALUES (@id, @workflow_id, @name, @description, @instruction_modifier)`
  );

  stmt.run({
    id,
    workflow_id: workflowId,
    name: input.name,
    description: input.description ?? null,
    instruction_modifier: input.instructionModifier,
  });

  const subtype = getWorkflowSubtypeById(db, id);
  if (!subtype) {
    throw new Error("Failed to create workflow subtype");
  }
  return subtype;
};

export const listWorkflowSubtypes = (
  db: SqliteDatabase,
  workflowId: string
): WorkflowSubtype[] => {
  const rows = db
    .prepare(
      `SELECT id, workflow_id, name, description, instruction_modifier, created_at, updated_at
       FROM workflow_subtypes
       WHERE workflow_id = ?
       ORDER BY created_at ASC`
    )
    .all(workflowId) as Array<{
    id: string;
    workflow_id: string;
    name: string;
    description: string | null;
    instruction_modifier: string;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map(mapWorkflowSubtypeRow);
};

export const getWorkflowSubtypeById = (
  db: SqliteDatabase,
  id: string
): WorkflowSubtype | null => {
  const row = db
    .prepare(
      `SELECT id, workflow_id, name, description, instruction_modifier, created_at, updated_at
       FROM workflow_subtypes WHERE id = ?`
    )
    .get(id) as
    | {
        id: string;
        workflow_id: string;
        name: string;
        description: string | null;
        instruction_modifier: string;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  return row ? mapWorkflowSubtypeRow(row) : null;
};

export const updateWorkflowSubtype = (
  db: SqliteDatabase,
  id: string,
  updates: UpdateWorkflowSubtypeInput
): WorkflowSubtype | null => {
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

  if (updates.instructionModifier !== undefined) {
    fields.push("instruction_modifier = @instruction_modifier");
    params.instruction_modifier = updates.instructionModifier;
  }

  if (fields.length === 0) {
    return getWorkflowSubtypeById(db, id);
  }

  fields.push("updated_at = datetime('now')");

  const sql = `UPDATE workflow_subtypes SET ${fields.join(
    ", "
  )} WHERE id = @id`;
  const result = db.prepare(sql).run(params);

  if (result.changes === 0) {
    return null;
  }

  return getWorkflowSubtypeById(db, id);
};

export const deleteWorkflowSubtype = (
  db: SqliteDatabase,
  id: string
): boolean => {
  const result = db
    .prepare(`DELETE FROM workflow_subtypes WHERE id = ?`)
    .run(id);
  return result.changes > 0;
};

// ============================================================================
// Mappers
// ============================================================================

const mapWorkflowRow = (row: {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  category: string;
  system_instruction: string;
  art_style: string | null;
  examples: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}): Workflow => ({
  id: row.id,
  name: row.name,
  description: row.description,
  thumbnail: row.thumbnail,
  category: row.category as Workflow["category"],
  systemInstruction: row.system_instruction,
  artStyle: row.art_style,
  examples: row.examples ? JSON.parse(row.examples) : null,
  metadata: row.metadata ? JSON.parse(row.metadata) : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapWorkflowSubtypeRow = (row: {
  id: string;
  workflow_id: string;
  name: string;
  description: string | null;
  instruction_modifier: string;
  created_at: string;
  updated_at: string;
}): WorkflowSubtype => ({
  id: row.id,
  workflowId: row.workflow_id,
  name: row.name,
  description: row.description,
  instructionModifier: row.instruction_modifier,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
