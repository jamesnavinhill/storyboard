export type AspectRatio = "16:9" | "9:16" | "1:1";

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Scene {
  id: string;
  projectId: string;
  description: string;
  aspectRatio: AspectRatio;
  orderIndex: number;
  primaryImageAssetId?: string | null;
  primaryVideoAssetId?: string | null;
  duration: number; // Duration in seconds
  createdAt: string;
  updatedAt: string;
}

export type ChatRole = "user" | "model";

export interface ChatMessage {
  id: string;
  projectId: string;
  sceneId?: string | null;
  role: ChatRole;
  text: string;
  imageAssetId?: string | null;
  createdAt: string;
}

export interface Asset {
  id: string;
  projectId: string;
  sceneId?: string | null;
  type: "image" | "video" | "attachment";
  mimeType: string;
  fileName: string;
  filePath: string;
  size: number;
  checksum?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface SettingsRecord {
  projectId: string;
  data: unknown;
  updatedAt: string;
}

export interface SceneGroup {
  id: string;
  projectId: string;
  name: string;
  color?: string | null;
  orderIndex: number;
  createdAt: string;
}

export interface SceneTag {
  id: string;
  projectId: string;
  name: string;
  color?: string | null;
}

export interface SceneHistoryEntry {
  id: string;
  sceneId: string;
  description: string;
  imageAssetId?: string | null;
  videoAssetId?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  createdAt: string;
}

export type FilePurpose =
  | "style-reference"
  | "character-reference"
  | "audio-reference"
  | "text-document"
  | "general-reference";

export interface UploadedFile {
  id: string;
  projectId: string;
  name: string;
  size: number;
  mimeType: string;
  purpose: FilePurpose;
  uri?: string;
  inlineData?: string;
  thumbnail?: string;
  uploadedAt: string;
}
