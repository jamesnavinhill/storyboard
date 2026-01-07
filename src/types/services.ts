import type {
  ChatMessage,
  Scene,
  SceneAssetStatus,
  SceneGroup,
  SceneTag,
  Settings,
  SceneHistoryEntry,
} from "../types";

export interface FileReference {
  id: string;
  purpose: string;
  uri?: string;
  inlineData?: string;
  mimeType: string;
}

export interface ChatGenerationRequest {
  prompt: string;
  history: ChatMessage[];
  image?: { data: string; mimeType: string };
  chatModel: Settings["chatModel"];
  workflow: Settings["workflow"];
  entryPoint?: string;
  files?: FileReference[];
}

export interface ChatProvider {
  generateResponse(request: ChatGenerationRequest): Promise<string>;
}

export interface StoryboardGenerationRequest {
  concept: string;
  image?: { data: string; mimeType: string };
  styleNames: string[];
  templateIds?: string[];
  sceneCount: number;
  workflow: Settings["workflow"];
  entryPoint?: string;
  files?: FileReference[];
}

export interface StylePreview {
  description: string;
  styleDirection: string;
}

export interface EnhancedScene {
  description: string;
  imagePrompt: string;
  animationPrompt: string;
  metadata: {
    duration: number;
    cameraMovement?: string;
    lighting?: string;
    mood?: string;
  };
}

export interface StoryboardGenerator {
  generateScenes(
    request: StoryboardGenerationRequest
  ): Promise<{ scenes: Array<{ description: string }>; modelResponse: string }>;
  regenerateDescription(existingDescription: string): Promise<string>;
  generateStylePreviews(request: {
    concept: string;
    workflow: Settings["workflow"];
    entryPoint?: string;
  }): Promise<StylePreview[]>;
  generateEnhancedStoryboard(request: {
    concept: string;
    sceneCount: number;
    workflow: Settings["workflow"];
    systemInstruction: string;
    selectedStyle?: string;
    entryPoint?: string;
  }): Promise<EnhancedScene[]>;
}

export interface GenerateImageRequest {
  projectId: string;
  sceneId: string;
  description: string;
  aspectRatio: Scene["aspectRatio"];
  stylePrompts: string[];
  imageModel: Settings["imageModel"];
  workflow: Settings["workflow"];
  templateId?: string;
  files?: FileReference[];
}

export interface EditImageRequest {
  projectId: string;
  sceneId: string;
  prompt: string;
}

export interface GenerateVideoRequest {
  projectId: string;
  sceneId: string;
  prompt: string;
  model: Settings["videoModel"];
  aspectRatio: Scene["aspectRatio"];
  resolution?: Settings["videoResolution"];
  duration?: number;
  referenceImages?: File[];
  lastFrame?: File;
}

export interface ExtendVideoRequest {
  projectId: string;
  sceneId: string;
  prompt: string;
  model: Settings["videoModel"];
  extensionCount: number;
}

export interface MediaGenerator {
  generateImage(request: GenerateImageRequest): Promise<SceneRecord>;
  editImage(request: EditImageRequest): Promise<SceneRecord>;
  suggestVideoPrompt(request: {
    projectId: string;
    sceneId: string;
  }): Promise<string>;
  suggestImageEditPrompt(request: {
    projectId: string;
    sceneId: string;
  }): Promise<string>;
  generateVideo(request: GenerateVideoRequest): Promise<SceneRecord>;
  extendVideo(request: ExtendVideoRequest): Promise<SceneRecord>;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SceneRecord {
  id: string;
  projectId: string;
  description: string;
  aspectRatio: Scene["aspectRatio"];
  orderIndex: number;
  primaryImageAssetId?: string | null;
  primaryVideoAssetId?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  imageStatus?: SceneAssetStatus;
  videoStatus?: SceneAssetStatus;
  groupId?: string | null;
  groupIds?: string[];
  tagIds?: string[];
  duration?: number; // Duration in seconds
  createdAt: string;
  updatedAt: string;
}

export interface SceneGroupRecord extends SceneGroup { }

export interface SceneTagRecord extends SceneTag { }

export interface SceneHistoryRecord extends SceneHistoryEntry { }

export interface ChatRecord {
  id: string;
  projectId: string;
  sceneId?: string | null;
  role: ChatMessage["role"];
  text: string;
  imageAssetId?: string | null;
  imageUrl?: string | null;
  createdAt: string;
}

export interface SettingsRecord {
  projectId: string;
  data: unknown;
  updatedAt: string;
}

export interface AssetUploadPayload {
  projectId: string;
  sceneId?: string;
  type: "image" | "video" | "attachment";
  mimeType: string;
  fileName?: string;
  data: string;
  metadata?: Record<string, unknown>;
}

export interface ProjectStorage {
  listProjects(): Promise<ProjectSummary[]>;
  createProject(payload: {
    name: string;
    description?: string;
  }): Promise<ProjectSummary>;
  getProjectDetail(
    projectId: string,
    include?: Array<"scenes" | "chat" | "settings" | "groups" | "tags">
  ): Promise<{
    project: ProjectSummary;
    scenes?: SceneRecord[];
    chat?: ChatRecord[];
    settings?: SettingsRecord | null;
    groups?: SceneGroupRecord[];
    tags?: SceneTagRecord[];
  }>;
  createScenes(
    projectId: string,
    scenes: Array<{
      description: string;
      aspectRatio: Scene["aspectRatio"];
      orderIndex?: number;
    }>
  ): Promise<SceneRecord[]>;
  updateScene(
    projectId: string,
    sceneId: string,
    updates: Partial<{
      description: string;
      aspectRatio: Scene["aspectRatio"];
      orderIndex: number;
      primaryImageAssetId: string | null;
      primaryVideoAssetId: string | null;
    }>
  ): Promise<SceneRecord>;
  appendChatMessage(
    projectId: string,
    payload: {
      role: ChatMessage["role"];
      text: string;
      sceneId?: string;
      imageAssetId?: string;
    }
  ): Promise<ChatRecord>;
  uploadAsset(
    payload: AssetUploadPayload
  ): Promise<{ asset: { id: string }; url: string }>;
  upsertSettings(projectId: string, data: unknown): Promise<SettingsRecord>;
  fetchSettings(projectId: string): Promise<SettingsRecord | null>;
  updateProject(
    projectId: string,
    updates: { name?: string; description?: string }
  ): Promise<ProjectSummary>;
  deleteProject(projectId: string): Promise<{
    deletedProjectId: string;
    deletedProjectName: string;
    nextProject: ProjectSummary | null;
    replacementProject: ProjectSummary | null;
  }>;
  searchProjects(query: string): Promise<ProjectSummary[]>;
  exportProject(projectId: string): Promise<Blob>;
  importProject(file: File): Promise<ProjectSummary>;
  reorderScenes(projectId: string, sceneIds: string[]): Promise<SceneRecord[]>;
  deleteScene(projectId: string, sceneId: string): Promise<SceneRecord[]>;
  listGroups(projectId: string): Promise<SceneGroupRecord[]>;
  createGroup(
    projectId: string,
    payload: { name: string; color?: string | null }
  ): Promise<SceneGroupRecord>;
  updateGroup(
    projectId: string,
    groupId: string,
    updates: { name?: string; color?: string | null }
  ): Promise<SceneGroupRecord>;
  deleteGroup(projectId: string, groupId: string): Promise<void>;
  assignScenesToGroup(
    projectId: string,
    groupId: string,
    sceneIds: string[]
  ): Promise<void>;
  removeScenesFromGroup(
    projectId: string,
    groupId: string,
    sceneIds: string[]
  ): Promise<void>;
  listTags(projectId: string): Promise<SceneTagRecord[]>;
  createTag(
    projectId: string,
    payload: { name: string; color?: string | null }
  ): Promise<SceneTagRecord>;
  deleteTag(projectId: string, tagId: string): Promise<void>;
  assignTags(
    projectId: string,
    sceneId: string,
    tagIds: string[]
  ): Promise<void>;
  removeTags(
    projectId: string,
    sceneId: string,
    tagIds: string[]
  ): Promise<void>;
  listSceneHistory(
    projectId: string,
    sceneId: string
  ): Promise<SceneHistoryRecord[]>;
  restoreSceneFromHistory(
    projectId: string,
    sceneId: string,
    historyId: string
  ): Promise<SceneRecord>;
}

export interface ServiceRegistry {
  chatProvider: ChatProvider;
  storyboardGenerator: StoryboardGenerator;
  mediaGenerator: MediaGenerator;
  projectStorage: ProjectStorage;
}
