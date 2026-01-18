import { randomUUID } from "node:crypto";
import type { UnifiedDatabase, DatabaseRow } from "../database";
import type { ChatMessage } from "../types";

interface AppendChatMessageInput {
  role: "user" | "model";
  text: string;
  sceneId?: string;
  imageAssetId?: string;
}

interface ChatMessageRow extends DatabaseRow {
  id: string;
  project_id: string;
  scene_id: string | null;
  role: "user" | "model";
  text: string;
  image_asset_id: string | null;
  created_at: string;
}

const mapChatRow = (row: ChatMessageRow): ChatMessage => ({
  id: row.id,
  projectId: row.project_id,
  sceneId: row.scene_id ?? null,
  role: row.role,
  text: row.text,
  imageAssetId: row.image_asset_id ?? null,
  createdAt: row.created_at,
});

export const appendChatMessage = async (
  db: UnifiedDatabase,
  projectId: string,
  input: AppendChatMessageInput
): Promise<ChatMessage> => {
  const id = randomUUID();

  await db.execute(
    `INSERT INTO chat_messages (id, project_id, scene_id, role, text, image_asset_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, projectId, input.sceneId ?? null, input.role, input.text, input.imageAssetId ?? null]
  );

  const row = await db.queryOne<ChatMessageRow>(
    `SELECT id, project_id, scene_id, role, text, image_asset_id, created_at FROM chat_messages WHERE id = ?`,
    [id]
  );

  if (!row) {
    throw new Error("Failed to append chat message");
  }

  return mapChatRow(row);
};

export const getChatMessages = async (
  db: UnifiedDatabase,
  projectId: string
): Promise<ChatMessage[]> => {
  const result = await db.query<ChatMessageRow>(
    `SELECT id, project_id, scene_id, role, text, image_asset_id, created_at FROM chat_messages WHERE project_id = ? ORDER BY created_at ASC`,
    [projectId]
  );

  return result.rows.map(mapChatRow);
};
