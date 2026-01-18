import { randomUUID } from "node:crypto";
import type { UnifiedDatabase, DatabaseRow } from "../database";
import { escapeSqlLikePattern } from "./storeUtils";
import { DEFAULT_WORKFLOWS } from "../data/defaults";

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

interface WorkflowRow extends DatabaseRow {
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

interface WorkflowSubtypeRow extends DatabaseRow {
  id: string;
  workflow_id: string;
  name: string;
  description: string | null;
  instruction_modifier: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Mappers
// ============================================================================

const mapWorkflowRow = (row: WorkflowRow): Workflow => ({
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

const mapWorkflowSubtypeRow = (row: WorkflowSubtypeRow): WorkflowSubtype => ({
  id: row.id,
  workflowId: row.workflow_id,
  name: row.name,
  description: row.description,
  instructionModifier: row.instruction_modifier,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ============================================================================
// Workflow CRUD Operations
// ============================================================================

export const createWorkflow = async (
  db: UnifiedDatabase,
  input: CreateWorkflowInput
): Promise<Workflow> => {
  const id = randomUUID();

  await db.execute(
    `INSERT INTO workflows (id, name, description, thumbnail, category, system_instruction, art_style, examples, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.description ?? null,
      input.thumbnail ?? null,
      input.category,
      input.systemInstruction,
      input.artStyle ?? null,
      input.examples ? JSON.stringify(input.examples) : null,
      input.metadata ? JSON.stringify(input.metadata) : null,
    ]
  );

  const workflow = await getWorkflowById(db, id);
  if (!workflow) {
    throw new Error("Failed to create workflow");
  }
  return workflow;
};

export const listWorkflows = async (
  db: UnifiedDatabase,
  options: ListWorkflowsOptions = {}
): Promise<Workflow[]> => {
  let sql = `SELECT id, name, description, thumbnail, category, system_instruction, art_style, examples, metadata, created_at, updated_at
             FROM workflows
             WHERE 1=1`;
  const params: unknown[] = [];

  if (options.category) {
    sql += ` AND category = ?`;
    params.push(options.category);
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
    const result = await db.query<WorkflowRow>(sql, params);

    // Fallback: If no workflows found and no specific search filters, return defaults
    if (result.rows.length === 0 && !options.category && !options.search) {
      const now = new Date().toISOString();
      return DEFAULT_WORKFLOWS.map((w) => ({
        id: "default-" + w.category,
        ...w,
        description: w.description || "",
        thumbnail: w.thumbnail || null,
        artStyle: w.artStyle || null,
        examples: null,
        metadata: null,
        createdAt: now,
        updatedAt: now,
      }));
    }

    return result.rows.map(mapWorkflowRow);
  } catch (error) {
    // If table doesn't exist (migration failed), return defaults
    if (!options.category && !options.search) {
      const now = new Date().toISOString();
      return DEFAULT_WORKFLOWS.map((w) => ({
        id: "default-" + w.category,
        ...w,
        description: w.description || "",
        thumbnail: w.thumbnail || null,
        artStyle: w.artStyle || null,
        examples: null,
        metadata: null,
        createdAt: now,
        updatedAt: now,
      }));
    }
    return [];
  }
};

export const getWorkflowById = async (
  db: UnifiedDatabase,
  id: string
): Promise<Workflow | null> => {
  const row = await db.queryOne<WorkflowRow>(
    `SELECT id, name, description, thumbnail, category, system_instruction, art_style, examples, metadata, created_at, updated_at
     FROM workflows WHERE id = ?`,
    [id]
  );

  return row ? mapWorkflowRow(row) : null;
};

export const updateWorkflow = async (
  db: UnifiedDatabase,
  id: string,
  updates: UpdateWorkflowInput
): Promise<Workflow | null> => {
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
    params.push(updates.category);
  }

  if (updates.systemInstruction !== undefined) {
    fields.push("system_instruction = ?");
    params.push(updates.systemInstruction);
  }

  if (updates.artStyle !== undefined) {
    fields.push("art_style = ?");
    params.push(updates.artStyle ?? null);
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
    return getWorkflowById(db, id);
  }

  fields.push("updated_at = datetime('now')");
  params.push(id);

  const sql = `UPDATE workflows SET ${fields.join(", ")} WHERE id = ?`;
  const result = await db.execute(sql, params);

  if (result.changes === 0) {
    return null;
  }

  return getWorkflowById(db, id);
};

export const deleteWorkflow = async (
  db: UnifiedDatabase,
  id: string
): Promise<boolean> => {
  const result = await db.execute(`DELETE FROM workflows WHERE id = ?`, [id]);
  return result.changes > 0;
};

// ============================================================================
// Workflow Subtype CRUD Operations
// ============================================================================

export const createWorkflowSubtype = async (
  db: UnifiedDatabase,
  workflowId: string,
  input: CreateWorkflowSubtypeInput
): Promise<WorkflowSubtype> => {
  const id = randomUUID();

  await db.execute(
    `INSERT INTO workflow_subtypes (id, workflow_id, name, description, instruction_modifier)
     VALUES (?, ?, ?, ?, ?)`,
    [
      id,
      workflowId,
      input.name,
      input.description ?? null,
      input.instructionModifier,
    ]
  );

  const subtype = await getWorkflowSubtypeById(db, id);
  if (!subtype) {
    throw new Error("Failed to create workflow subtype");
  }
  return subtype;
};

export const listWorkflowSubtypes = async (
  db: UnifiedDatabase,
  workflowId: string
): Promise<WorkflowSubtype[]> => {
  const result = await db.query<WorkflowSubtypeRow>(
    `SELECT id, workflow_id, name, description, instruction_modifier, created_at, updated_at
     FROM workflow_subtypes
     WHERE workflow_id = ?
     ORDER BY created_at ASC`,
    [workflowId]
  );

  return result.rows.map(mapWorkflowSubtypeRow);
};

export const getWorkflowSubtypeById = async (
  db: UnifiedDatabase,
  id: string
): Promise<WorkflowSubtype | null> => {
  const row = await db.queryOne<WorkflowSubtypeRow>(
    `SELECT id, workflow_id, name, description, instruction_modifier, created_at, updated_at
     FROM workflow_subtypes WHERE id = ?`,
    [id]
  );

  return row ? mapWorkflowSubtypeRow(row) : null;
};

export const updateWorkflowSubtype = async (
  db: UnifiedDatabase,
  id: string,
  updates: UpdateWorkflowSubtypeInput
): Promise<WorkflowSubtype | null> => {
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

  if (updates.instructionModifier !== undefined) {
    fields.push("instruction_modifier = ?");
    params.push(updates.instructionModifier);
  }

  if (fields.length === 0) {
    return getWorkflowSubtypeById(db, id);
  }

  fields.push("updated_at = datetime('now')");
  params.push(id);

  const sql = `UPDATE workflow_subtypes SET ${fields.join(", ")} WHERE id = ?`;
  const result = await db.execute(sql, params);

  if (result.changes === 0) {
    return null;
  }

  return getWorkflowSubtypeById(db, id);
};

export const deleteWorkflowSubtype = async (
  db: UnifiedDatabase,
  id: string
): Promise<boolean> => {
  const result = await db.execute(`DELETE FROM workflow_subtypes WHERE id = ?`, [
    id,
  ]);
  return result.changes > 0;
};
