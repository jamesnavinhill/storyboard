export type SceneActivityType =
  | "idle"
  | "generating-image"
  | "editing-image"
  | "generating-video"
  | "regenerating-description"
  | "regenerating-prompt";

export type ScenePanelName = "edit" | "animate";

export interface ScenePanelsState {
  edit: boolean;
  animate: boolean;
}

export type SceneAssetStatus = "ready" | "missing" | "absent";

export type SceneErrorKind =
  | "image-generation"
  | "image-edit"
  | "video-generation"
  | "regenerate-description"
  | "asset-missing";

export interface SceneErrorState {
  kind: SceneErrorKind;
  message: string;
  canRetry: boolean;
  occurredAt: number;
  requestId?: string;
  docLink?: string;
  errorCode?: string;
}

export interface SceneUIState {
  activity: SceneActivityType;
  panels: ScenePanelsState;
  lastError: SceneErrorState | null;
  /**
   * When true, the video element should autoplay once (muted) after a successful generation
   * and immediately reset to false after playback starts. This flag is not persisted.
   */
  autoplayPending?: boolean;
}

export interface Scene {
  id: string;
  projectId?: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  imageAssetId?: string | null;
  videoAssetId?: string | null;
  aspectRatio: "16:9" | "9:16" | "1:1";
  orderIndex?: number;
  groupId?: string | null;
  groupIds?: string[];
  tagIds?: string[];
  imageStatus: SceneAssetStatus;
  videoStatus: SceneAssetStatus;
  uiState: SceneUIState;
  duration: number; // Duration in seconds
}

export interface SceneGroup {
  id: string;
  projectId: string;
  name: string;
  color?: string | null;
  orderIndex: number;
  sceneIds: string[];
  isStacked?: boolean;
}

export interface SceneTag {
  id: string;
  projectId: string;
  name: string;
  color?: string | null;
  sceneIds?: string[];
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
  image?: string;
}

export interface PresetStyle {
  id: string;
  name: string;
  thumbnail: string;
  prompt: string;
}

export type Workflow =
  | "music-video"
  | "product-commercial"
  | "viral-social"
  | "explainer-video";
export type ChatModel =
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite"
  | "gemini-3-pro-image-preview";
export type ImageModel =
  | "imagen-4.0-generate-001"
  | "imagen-4.0-ultra-generate-001"
  | "imagen-4.0-fast-generate-001"
  | "imagen-3.0-generate-002"
  | "gemini-2.5-flash-image"
  | "gemini-3-pro-image-preview";
export type VideoModel =
  | "veo-3.1-generate-preview"
  | "veo-3.1-fast-generate-preview"
  | "veo-2.0-generate-001"
  | "veo-3.0-generate-001"
  | "veo-3.0-fast-generate-001";

export type VideoAutoplayMode = "never" | "on-generate";

export interface Settings {
  sceneCount: number;
  chatModel: ChatModel;
  imageModel: ImageModel;
  videoModel: VideoModel;
  workflow: Workflow;
  /**
   * Controls whether videos autoplay. Default: "on-generate" (only immediately after generation).
   * Set to "never" to fully disable autoplay across devices.
   */
  videoAutoplay: VideoAutoplayMode;
  videoResolution: "1080p" | "720p";
  videoDuration: 4 | 6 | 8;
}

export type ChatAgent = "generate" | "chat";

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
