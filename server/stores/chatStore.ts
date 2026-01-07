import { randomUUID } from "node:crypto";
import type { Database as SqliteDatabase } from "better-sqlite3";
import type { ChatMessage } from "../types";

interface AppendChatMessageInput {
  role: "user" | "model";
  text: string;
  sceneId?: string;
  imageAssetId?: string;
}

export const appendChatMessage = (
  db: SqliteDatabase,
  projectId: string,
  input: AppendChatMessageInput
): ChatMessage => {
  const id = randomUUID();
  db.prepare<{
    id: string;
    projectId: string;
    sceneId?: string;
    role: "user" | "model";
    text: string;
    imageAssetId?: string;
  }>(
    `INSERT INTO chat_messages (id, project_id, scene_id, role, text, image_asset_id)
     VALUES (@id, @projectId, @sceneId, @role, @text, @imageAssetId)`
  ).run({
    id,
    projectId,
    sceneId: input.sceneId,
    role: input.role,
    text: input.text,
    imageAssetId: input.imageAssetId,
  });

  const row = db
    .prepare(
      `SELECT id, project_id, scene_id, role, text, image_asset_id, created_at FROM chat_messages WHERE id = ?`
    )
    .get(id) as {
    id: string;
    project_id: string;
    scene_id?: string | null;
    role: "user" | "model";
    text: string;
    image_asset_id?: string | null;
    created_at: string;
  };
  return mapChatRow(row);
};

export const getChatMessages = (
  db: SqliteDatabase,
  projectId: string
): ChatMessage[] => {
  const rows = db
    .prepare(
      `SELECT id, project_id, scene_id, role, text, image_asset_id, created_at FROM chat_messages WHERE project_id = ? ORDER BY created_at ASC`
    )
    .all(projectId) as Array<{
    id: string;
    project_id: string;
    scene_id?: string | null;
    role: "user" | "model";
    text: string;
    image_asset_id?: string | null;
    created_at: string;
  }>;
  return rows.map(mapChatRow);
};

// Mappers

const mapChatRow = (row: {
  id: string;
  project_id: string;
  scene_id?: string | null;
  role: "user" | "model";
  text: string;
  image_asset_id?: string | null;
  created_at: string;
}): ChatMessage => ({
  id: row.id,
  projectId: row.project_id,
  sceneId: row.scene_id ?? null,
  role: row.role,
  text: row.text,
  imageAssetId: row.image_asset_id ?? null,
  createdAt: row.created_at,
});
