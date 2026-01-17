import type {
  ProjectStorage,
  ProjectSummary,
  SceneRecord,
  ChatRecord,
  SettingsRecord,
  SceneGroupRecord,
  SceneTagRecord,
  SceneHistoryRecord,
} from "../../../types/services";

// Thin persistence adapter around ProjectStorage to centralize IO calls.
export interface ProjectServices {
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
      aspectRatio: SceneRecord["aspectRatio"];
      orderIndex?: number;
    }>
  ): Promise<SceneRecord[]>;
  updateScene(
    projectId: string,
    sceneId: string,
    updates: Partial<{
      description: string;
      aspectRatio: SceneRecord["aspectRatio"];
      orderIndex: number;
      primaryImageAssetId: string | null;
      primaryVideoAssetId: string | null;
    }>
  ): Promise<SceneRecord>;
  appendChatMessage(
    projectId: string,
    payload: {
      role: ChatRecord["role"];
      text: string;
      sceneId?: string;
      imageAssetId?: string;
    }
  ): Promise<ChatRecord>;
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
  exportProject(projectId: string): Promise<Blob>;
  importProject(file: File): Promise<ProjectSummary>;
  reorderScenes(projectId: string, sceneIds: string[]): Promise<SceneRecord[]>;
  deleteScene(projectId: string, sceneId: string): Promise<SceneRecord[]>;
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

export const createProjectServices = (
  storage: ProjectStorage
): ProjectServices => ({
  listProjects: () => storage.listProjects(),
  createProject: (payload) => storage.createProject(payload),
  getProjectDetail: (projectId, include) =>
    storage.getProjectDetail(projectId, include),
  createScenes: (projectId, scenes) => storage.createScenes(projectId, scenes),
  updateScene: (projectId, sceneId, updates) =>
    storage.updateScene(projectId, sceneId, updates),
  appendChatMessage: (projectId, payload) =>
    storage.appendChatMessage(projectId, payload),
  upsertSettings: (projectId, data) => storage.upsertSettings(projectId, data),
  fetchSettings: (projectId) => storage.fetchSettings(projectId),
  updateProject: (projectId, updates) =>
    storage.updateProject(projectId, updates),
  deleteProject: (projectId) => storage.deleteProject(projectId),
  exportProject: (projectId) => storage.exportProject(projectId),
  importProject: (file) => storage.importProject(file),
  reorderScenes: (projectId, sceneIds) =>
    storage.reorderScenes(projectId, sceneIds),
  deleteScene: (projectId, sceneId) => storage.deleteScene(projectId, sceneId),
  createGroup: (projectId, payload) => storage.createGroup(projectId, payload),
  updateGroup: (projectId, groupId, updates) =>
    storage.updateGroup(projectId, groupId, updates),
  deleteGroup: (projectId, groupId) => storage.deleteGroup(projectId, groupId),
  assignScenesToGroup: (projectId, groupId, sceneIds) =>
    storage.assignScenesToGroup(projectId, groupId, sceneIds),
  removeScenesFromGroup: (projectId, groupId, sceneIds) =>
    storage.removeScenesFromGroup(projectId, groupId, sceneIds),
  createTag: (projectId, payload) => storage.createTag(projectId, payload),
  deleteTag: (projectId, tagId) => storage.deleteTag(projectId, tagId),
  assignTags: (projectId, sceneId, tagIds) =>
    storage.assignTags(projectId, sceneId, tagIds),
  removeTags: (projectId, sceneId, tagIds) =>
    storage.removeTags(projectId, sceneId, tagIds),
  listSceneHistory: (projectId, sceneId) =>
    storage.listSceneHistory(projectId, sceneId),
  restoreSceneFromHistory: (projectId, sceneId, historyId) =>
    storage.restoreSceneFromHistory(projectId, sceneId, historyId),
});
