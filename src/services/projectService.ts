import { z } from "zod";
import type { SceneHistoryEntry } from "../types";
import type {
  ProjectStorage,
  ProjectSummary,
  SceneRecord,
  ChatRecord,
  SettingsRecord,
  SceneGroupRecord,
  SceneTagRecord,
} from "../types/services";

export type AspectRatio = "16:9" | "9:16" | "1:1";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

interface RequestOptions extends RequestInit {
  parseJson?: boolean;
}

const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { parseJson = true, headers, ...rest } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    credentials: "include",
  });
  if (!response.ok) {
    const errorBody = parseJson
      ? await response.json().catch(() => undefined)
      : undefined;
    const message =
      (errorBody as { error?: unknown })?.error ?? response.statusText;
    throw new Error(typeof message === "string" ? message : "Request failed");
  }
  if (!parseJson) {
    return undefined as T;
  }
  return (await response.json()) as T;
};

const aspectRatioSchema = z.union([
  z.literal("16:9"),
  z.literal("9:16"),
  z.literal("1:1"),
]);
const assetStatusSchema = z.union([
  z.literal("ready"),
  z.literal("missing"),
  z.literal("absent"),
]);

export const projectEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const assetMetadataSchema = z.record(z.unknown()).nullable().optional();

const assetEntitySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  sceneId: z.string().nullable().optional(),
  type: z.union([
    z.literal("image"),
    z.literal("video"),
    z.literal("attachment"),
  ]),
  mimeType: z.string(),
  fileName: z.string(),
  filePath: z.string(),
  size: z.number(),
  checksum: z.string().nullable().optional(),
  metadata: assetMetadataSchema,
  createdAt: z.string(),
});

export const sceneEntitySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  description: z.string(),
  aspectRatio: aspectRatioSchema,
  orderIndex: z.number(),
  primaryImageAssetId: z.string().nullable().optional(),
  primaryVideoAssetId: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  imageStatus: assetStatusSchema,
  videoStatus: assetStatusSchema,
  imageAsset: assetEntitySchema.nullable().optional(),
  videoAsset: assetEntitySchema.nullable().optional(),
  groupId: z.string().nullable().optional(),
  groupIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const sceneGroupEntitySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  color: z.string().nullable().optional(),
  orderIndex: z.number(),
  sceneIds: z.array(z.string()).default([]),
});

export const sceneTagEntitySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  color: z.string().nullable().optional(),
  sceneIds: z.array(z.string()).optional(),
});

export const chatMessageEntitySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  sceneId: z.string().nullable().optional(),
  role: z.union([z.literal("user"), z.literal("model")]),
  text: z.string(),
  imageAssetId: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const settingsEntitySchema = z.object({
  projectId: z.string(),
  data: z.unknown(),
  updatedAt: z.string(),
});

export const sceneHistoryEntryEntitySchema = z.object({
  id: z.string(),
  sceneId: z.string(),
  description: z.string(),
  imageAssetId: z.string().nullable().optional(),
  videoAssetId: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  createdAt: z.string(),
});

const assetResponseSchema = z.object({
  asset: z.object({ id: z.string() }),
  url: z.string(),
});

export type ProjectEntity = z.infer<typeof projectEntitySchema>;

export type SceneEntity = z.infer<typeof sceneEntitySchema>;

export type ChatMessageEntity = z.infer<typeof chatMessageEntitySchema>;

export type SettingsEntity = z.infer<typeof settingsEntitySchema>;

export type SceneHistoryEntryEntity = z.infer<
  typeof sceneHistoryEntryEntitySchema
>;

const toProjectSummary = (entity: ProjectEntity): ProjectSummary => ({
  id: entity.id,
  name: entity.name,
  description: entity.description ?? null,
  createdAt: entity.createdAt,
  updatedAt: entity.updatedAt,
});

const toSceneRecord = (entity: SceneEntity): SceneRecord => ({
  id: entity.id,
  projectId: entity.projectId,
  description: entity.description,
  aspectRatio: entity.aspectRatio,
  orderIndex: entity.orderIndex,
  primaryImageAssetId: entity.primaryImageAssetId ?? null,
  primaryVideoAssetId: entity.primaryVideoAssetId ?? null,
  imageUrl: entity.imageUrl ?? null,
  videoUrl: entity.videoUrl ?? null,
  imageStatus: entity.imageStatus,
  videoStatus: entity.videoStatus,
  groupId: entity.groupId ?? entity.groupIds?.[0] ?? null,
  groupIds:
    entity.groupIds ??
    (entity.groupId !== undefined && entity.groupId !== null
      ? [entity.groupId]
      : []),
  tagIds: entity.tagIds ?? [],
  createdAt: entity.createdAt,
  updatedAt: entity.updatedAt,
});

const toChatRecord = (entity: ChatMessageEntity): ChatRecord => ({
  id: entity.id,
  projectId: entity.projectId,
  sceneId: entity.sceneId ?? null,
  role: entity.role,
  text: entity.text,
  imageAssetId: entity.imageAssetId ?? null,
  imageUrl: entity.imageUrl ?? null,
  createdAt: entity.createdAt,
});

const toSettingsRecord = (entity: SettingsEntity): SettingsRecord => ({
  projectId: entity.projectId,
  data: entity.data,
  updatedAt: entity.updatedAt,
});

const toSceneGroupRecord = (
  entity: z.infer<typeof sceneGroupEntitySchema>
): SceneGroupRecord => ({
  id: entity.id,
  projectId: entity.projectId,
  name: entity.name,
  color: entity.color ?? null,
  orderIndex: entity.orderIndex,
  sceneIds: entity.sceneIds,
});

const toSceneTagRecord = (
  entity: z.infer<typeof sceneTagEntitySchema>
): SceneTagRecord => ({
  id: entity.id,
  projectId: entity.projectId,
  name: entity.name,
  color: entity.color ?? null,
  sceneIds: entity.sceneIds ?? [],
});

export interface AssetUploadPayload {
  projectId: string;
  sceneId?: string;
  type: "image" | "video" | "attachment";
  mimeType: string;
  fileName?: string;
  data: string;
  metadata?: Record<string, unknown>;
}

export const listProjects = async (): Promise<ProjectSummary[]> => {
  const result = await apiRequest<{ projects: unknown }>("/projects");
  const parsed = z
    .object({ projects: z.array(projectEntitySchema) })
    .parse(result);
  return parsed.projects.map(toProjectSummary);
};

export const createProject = async (payload: {
  name: string;
  description?: string;
}): Promise<ProjectSummary> => {
  const result = await apiRequest<{ project: unknown }>("/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const { project } = z.object({ project: projectEntitySchema }).parse(result);
  return toProjectSummary(project);
};

export const getProjectDetail = async (
  projectId: string,
  include: Array<"scenes" | "chat" | "settings" | "groups" | "tags"> = [
    "scenes",
    "chat",
    "settings",
    "groups",
    "tags",
  ]
): Promise<{
  project: ProjectSummary;
  scenes?: SceneRecord[];
  chat?: ChatRecord[];
  settings?: SettingsRecord | null;
  groups?: SceneGroupRecord[];
  tags?: SceneTagRecord[];
}> => {
  const params = new URLSearchParams();
  if (include.length > 0) {
    params.set("include", include.join(","));
  }
  const raw = await apiRequest(`/projects/${projectId}?${params.toString()}`);
  const parsed = z
    .object({
      project: projectEntitySchema,
      scenes: z.array(sceneEntitySchema).optional(),
      chat: z.array(chatMessageEntitySchema).optional(),
      settings: settingsEntitySchema.nullable().optional(),
      groups: z.array(sceneGroupEntitySchema).optional(),
      tags: z.array(sceneTagEntitySchema).optional(),
    })
    .parse(raw);
  return {
    project: toProjectSummary(parsed.project),
    scenes: parsed.scenes?.map(toSceneRecord),
    chat: parsed.chat?.map(toChatRecord),
    settings: parsed.settings ? toSettingsRecord(parsed.settings) : null,
    groups: parsed.groups?.map(toSceneGroupRecord),
    tags: parsed.tags?.map(toSceneTagRecord),
  };
};

export const createScenes = async (
  projectId: string,
  scenes: Array<{
    description: string;
    aspectRatio: AspectRatio;
    orderIndex?: number;
  }>
): Promise<SceneRecord[]> => {
  const result = await apiRequest<{ scenes: unknown }>(
    `/projects/${projectId}/scenes`,
    {
      method: "POST",
      body: JSON.stringify({ scenes }),
    }
  );
  const parsed = z.object({ scenes: z.array(sceneEntitySchema) }).parse(result);
  return parsed.scenes.map(toSceneRecord);
};

export const updateScene = async (
  projectId: string,
  sceneId: string,
  updates: Partial<{
    description: string;
    aspectRatio: AspectRatio;
    orderIndex: number;
    primaryImageAssetId: string | null;
    primaryVideoAssetId: string | null;
  }>
): Promise<SceneRecord> => {
  const result = await apiRequest<{ scene: unknown }>(
    `/projects/${projectId}/scenes/${sceneId}`,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    }
  );
  const parsed = z.object({ scene: sceneEntitySchema }).parse(result);
  return toSceneRecord(parsed.scene);
};

export const appendChatMessage = async (
  projectId: string,
  payload: {
    role: "user" | "model";
    text: string;
    sceneId?: string;
    imageAssetId?: string;
  }
): Promise<ChatRecord> => {
  const result = await apiRequest<{ message: unknown }>(
    `/projects/${projectId}/chats`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  const parsed = z.object({ message: chatMessageEntitySchema }).parse(result);
  return toChatRecord(parsed.message);
};

export const listChatMessages = async (
  projectId: string
): Promise<ChatRecord[]> => {
  const result = await apiRequest<{ chat: unknown }>(
    `/projects/${projectId}/chats`
  );
  const parsed = z
    .object({ chat: z.array(chatMessageEntitySchema) })
    .parse(result);
  return parsed.chat.map(toChatRecord);
};

export const listSceneHistory = async (
  projectId: string,
  sceneId: string
): Promise<SceneHistoryEntry[]> => {
  const result = await apiRequest<{ history: unknown }>(
    `/projects/${projectId}/scenes/${sceneId}/history`
  );
  const parsed = z
    .object({ history: z.array(sceneHistoryEntryEntitySchema) })
    .parse(result);
  return parsed.history.map((entry) => ({
    id: entry.id,
    sceneId: entry.sceneId,
    description: entry.description,
    imageAssetId: entry.imageAssetId ?? null,
    videoAssetId: entry.videoAssetId ?? null,
    imageUrl: entry.imageUrl ?? null,
    videoUrl: entry.videoUrl ?? null,
    createdAt: entry.createdAt,
  }));
};

export const restoreSceneFromHistory = async (
  projectId: string,
  sceneId: string,
  historyId: string
): Promise<SceneRecord> => {
  const result = await apiRequest<{ scene: unknown }>(
    `/projects/${projectId}/scenes/${sceneId}/history/${historyId}/restore`,
    {
      method: "POST",
    }
  );
  const parsed = z.object({ scene: sceneEntitySchema }).parse(result);
  return toSceneRecord(parsed.scene);
};

export const uploadAsset = async (
  payload: AssetUploadPayload
): Promise<{ asset: { id: string }; url: string }> => {
  const result = await apiRequest<{ asset: unknown; url: unknown }>(`/assets`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const parsed = assetResponseSchema.parse(result);
  return { asset: { id: parsed.asset.id }, url: parsed.url };
};

export const upsertSettings = async (
  projectId: string,
  data: unknown
): Promise<SettingsRecord> => {
  const result = await apiRequest<{ settings: unknown }>(
    `/projects/${projectId}/settings`,
    {
      method: "PUT",
      body: JSON.stringify({ data }),
    }
  );
  const parsed = z.object({ settings: settingsEntitySchema }).parse(result);
  return toSettingsRecord(parsed.settings);
};

export const fetchSettings = async (
  projectId: string
): Promise<SettingsRecord | null> => {
  const result = await apiRequest<{ settings: unknown }>(
    `/projects/${projectId}/settings`
  );
  const parsed = z
    .object({ settings: settingsEntitySchema.nullable() })
    .parse(result);
  return parsed.settings ? toSettingsRecord(parsed.settings) : null;
};

export const updateProject = async (
  projectId: string,
  updates: { name?: string; description?: string }
): Promise<ProjectSummary> => {
  const result = await apiRequest<{ project: unknown }>(
    `/projects/${projectId}`,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    }
  );
  const { project } = z.object({ project: projectEntitySchema }).parse(result);
  return toProjectSummary(project);
};

export const deleteProject = async (
  projectId: string
): Promise<{
  deletedProjectId: string;
  deletedProjectName: string;
  nextProject: ProjectSummary | null;
  replacementProject: ProjectSummary | null;
}> => {
  const result = await apiRequest<{
    deletedProjectId: unknown;
    deletedProjectName: unknown;
    nextProject: unknown;
    replacementProject: unknown;
  }>(`/projects/${projectId}`, {
    method: "DELETE",
  });
  const parsed = z
    .object({
      deletedProjectId: z.string(),
      deletedProjectName: z.string(),
      nextProject: projectEntitySchema.nullable(),
      replacementProject: projectEntitySchema.nullable(),
    })
    .parse(result);
  return {
    deletedProjectId: parsed.deletedProjectId,
    deletedProjectName: parsed.deletedProjectName,
    nextProject: parsed.nextProject
      ? toProjectSummary(parsed.nextProject)
      : null,
    replacementProject: parsed.replacementProject
      ? toProjectSummary(parsed.replacementProject)
      : null,
  };
};

export const searchProjects = async (
  query: string
): Promise<ProjectSummary[]> => {
  const result = await apiRequest<{ projects: unknown }>(
    `/projects/search?q=${encodeURIComponent(query)}`
  );
  const parsed = z
    .object({ projects: z.array(projectEntitySchema) })
    .parse(result);
  return parsed.projects.map(toProjectSummary);
};

export const exportProject = async (projectId: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE}/projects/${projectId}/export`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to export project");
  }
  return await response.blob();
};

export const importProject = async (file: File): Promise<ProjectSummary> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE}/projects/import`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to import project");
  }
  const result = await response.json();
  const { project } = z.object({ project: projectEntitySchema }).parse(result);
  return toProjectSummary(project);
};

export const reorderScenes = async (
  projectId: string,
  sceneIds: string[]
): Promise<SceneRecord[]> => {
  const result = await apiRequest<{ scenes: unknown }>(
    `/projects/${projectId}/scenes/reorder`,
    {
      method: "POST",
      body: JSON.stringify({ sceneIds }),
    }
  );
  const parsed = z.object({ scenes: z.array(sceneEntitySchema) }).parse(result);
  return parsed.scenes.map(toSceneRecord);
};

export const deleteScene = async (
  projectId: string,
  sceneId: string
): Promise<SceneRecord[]> => {
  const result = await apiRequest<{ scenes: unknown }>(
    `/projects/${projectId}/scenes/${sceneId}`,
    {
      method: "DELETE",
    }
  );
  const parsed = z.object({ scenes: z.array(sceneEntitySchema) }).parse(result);
  return parsed.scenes.map(toSceneRecord);
};

export const listGroups = async (
  projectId: string
): Promise<SceneGroupRecord[]> => {
  const result = await apiRequest<{ groups: unknown }>(
    `/projects/${projectId}/groups`
  );
  const parsed = z
    .object({ groups: z.array(sceneGroupEntitySchema) })
    .parse(result);
  return parsed.groups.map(toSceneGroupRecord);
};

export const createGroup = async (
  projectId: string,
  payload: { name: string; color?: string | null }
): Promise<SceneGroupRecord> => {
  const result = await apiRequest<{ group: unknown }>(
    `/projects/${projectId}/groups`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  const parsed = z.object({ group: sceneGroupEntitySchema }).parse(result);
  return toSceneGroupRecord(parsed.group);
};

export const updateGroup = async (
  projectId: string,
  groupId: string,
  updates: { name?: string; color?: string | null }
): Promise<SceneGroupRecord> => {
  const result = await apiRequest<{ group: unknown }>(
    `/projects/${projectId}/groups/${groupId}`,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    }
  );
  const parsed = z.object({ group: sceneGroupEntitySchema }).parse(result);
  return toSceneGroupRecord(parsed.group);
};

export const deleteGroup = async (
  projectId: string,
  groupId: string
): Promise<void> => {
  await apiRequest(`/projects/${projectId}/groups/${groupId}`, {
    method: "DELETE",
  });
};

export const assignScenesToGroup = async (
  projectId: string,
  groupId: string,
  sceneIds: string[]
): Promise<void> => {
  if (sceneIds.length === 0) return;
  await apiRequest(`/projects/${projectId}/groups/${groupId}/scenes`, {
    method: "POST",
    body: JSON.stringify({ sceneIds }),
  });
};

export const removeScenesFromGroup = async (
  projectId: string,
  groupId: string,
  sceneIds: string[]
): Promise<void> => {
  if (sceneIds.length === 0) return;
  await apiRequest(`/projects/${projectId}/groups/${groupId}/scenes`, {
    method: "DELETE",
    body: JSON.stringify({ sceneIds }),
  });
};

export const listTags = async (
  projectId: string
): Promise<SceneTagRecord[]> => {
  const result = await apiRequest<{ tags: unknown }>(
    `/projects/${projectId}/tags`
  );
  const parsed = z
    .object({ tags: z.array(sceneTagEntitySchema) })
    .parse(result);
  return parsed.tags.map(toSceneTagRecord);
};

export const createTag = async (
  projectId: string,
  payload: { name: string; color?: string | null }
): Promise<SceneTagRecord> => {
  const result = await apiRequest<{ tag: unknown }>(
    `/projects/${projectId}/tags`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  const parsed = z.object({ tag: sceneTagEntitySchema }).parse(result);
  return toSceneTagRecord(parsed.tag);
};

export const deleteTag = async (
  projectId: string,
  tagId: string
): Promise<void> => {
  await apiRequest(`/projects/${projectId}/tags/${tagId}`, {
    method: "DELETE",
  });
};

export const assignTags = async (
  projectId: string,
  sceneId: string,
  tagIds: string[]
): Promise<void> => {
  if (tagIds.length === 0) return;
  await apiRequest(`/projects/${projectId}/scenes/${sceneId}/tags`, {
    method: "POST",
    body: JSON.stringify({ tagIds }),
  });
};

export const removeTags = async (
  projectId: string,
  sceneId: string,
  tagIds: string[]
): Promise<void> => {
  if (tagIds.length === 0) return;
  await apiRequest(`/projects/${projectId}/scenes/${sceneId}/tags`, {
    method: "DELETE",
    body: JSON.stringify({ tagIds }),
  });
};

export interface AssetEntity {
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
  url?: string;
  thumbnailUrl?: string;
}

const assetEntitySchemaWithUrls = z
  .object({
    id: z.string(),
    projectId: z.string(),
    sceneId: z.string().nullable().optional(),
    type: z.union([
      z.literal("image"),
      z.literal("video"),
      z.literal("attachment"),
    ]),
    mimeType: z.string(),
    fileName: z.string(),
    filePath: z.string(),
    size: z.number(),
    checksum: z.string().nullable().optional(),
    metadata: z.record(z.unknown()).nullable().optional(),
    createdAt: z.string(),
    url: z.string().optional(),
    thumbnailUrl: z.string().optional(),
  })
  .strict();

export const listAssets = async (
  projectId: string,
  filters?: { type?: "image" | "video" | "attachment"; sceneId?: string }
): Promise<AssetEntity[]> => {
  const params = new URLSearchParams();
  if (filters?.type) {
    params.set("type", filters.type);
  }
  if (filters?.sceneId) {
    params.set("sceneId", filters.sceneId);
  }
  const queryString = params.toString();
  const result = await apiRequest<{ assets: unknown }>(
    `/projects/${projectId}/assets${queryString ? `?${queryString}` : ""}`
  );
  const parsed = z
    .object({ assets: z.array(assetEntitySchemaWithUrls) })
    .parse(result);
  return parsed.assets as AssetEntity[];
};

export const updateAsset = async (
  assetId: string,
  updates: { fileName?: string; metadata?: Record<string, unknown> }
): Promise<AssetEntity> => {
  const result = await apiRequest<{ asset: unknown; url: unknown }>(
    `/assets/${assetId}`,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    }
  );
  const parsed = z
    .object({
      asset: assetEntitySchemaWithUrls,
      url: z.string(),
    })
    .parse(result);
  return { ...parsed.asset, url: parsed.url } as AssetEntity;
};

export const deleteAsset = async (assetId: string): Promise<void> => {
  await apiRequest(`/assets/${assetId}`, {
    method: "DELETE",
    parseJson: false,
  });
};

export const projectStorage: ProjectStorage = {
  listProjects,
  createProject,
  getProjectDetail,
  createScenes,
  updateScene,
  appendChatMessage,
  uploadAsset,
  upsertSettings,
  fetchSettings,
  updateProject,
  deleteProject,
  searchProjects,
  exportProject,
  importProject,
  reorderScenes,
  deleteScene,
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  assignScenesToGroup,
  removeScenesFromGroup,
  listTags,
  createTag,
  deleteTag,
  assignTags,
  removeTags,
  listSceneHistory,
  restoreSceneFromHistory,
};
