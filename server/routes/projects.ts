import { Router } from "express";
import type { Database as SqliteDatabase } from "better-sqlite3";
import type { AppConfig } from "../config";
import { ZodError, type infer as ZodInfer } from "zod";
import {
  appendChatMessageSchema,
  createProjectSchema,
  createScenesSchema,
  updateProjectSchema,
  updateSceneSchema,
  upsertSettingsSchema,
  reorderScenesSchema,
  createSceneGroupSchema,
  updateSceneGroupSchema,
  addScenesToGroupSchema,
  createSceneTagSchema,
  assignTagsSchema,
  saveDocumentSchema,
  exportDocumentSchema,
} from "../validation";
import {
  appendChatMessage,
  createProject,
  createScenes,
  deleteProject,
  getChatMessages,
  getProjectById,
  getScenesByProject,
  getSceneById,
  getSettings,
  listProjects,
  searchProjects,
  updateProject,
  updateScene,
  upsertSettings,
  countProjects,
  reorderScenes,
  getSceneHistory,
  restoreSceneFromHistory,
  createSceneGroup,
  listSceneGroups,
  updateSceneGroup,
  deleteSceneGroup,
  addScenesToGroup,
  removeScenesFromGroup,
  createSceneTag,
  listSceneTags,
  assignTagsToScene,
  removeTagsFromScene,
  deleteSceneTag,
  getScenesWithGroups,
  getScenesWithTags,
  deleteScene,
  type ProjectSortField,
  type ProjectSortOrder,
} from "../stores/projectStore";
import {
  enrichScenesWithAssets,
  enrichChatMessagesWithAssets,
} from "../utils/sceneEnrichment";
import { listAssetsByProject } from "../stores/assetStore";
import { getAssetPublicUrl } from "../utils/assetHelpers";
import type { Scene, ChatMessage, Project } from "../types";
import { type DocumentContent } from "../stores/documentStore";
import { cleanupProjectFiles } from "../services/fileUploadService";
import {
  getProjectDocument,
  saveProjectDocument,
  getProjectDocumentHistory,
  restoreProjectDocumentVersion,
  exportProjectDocument,
  type ExportFormat,
} from "../services/documentService";
import { formatDuration } from "../utils/durationCalculation";

type CreateProjectPayload = ZodInfer<typeof createProjectSchema>;
type UpdateProjectPayload = ZodInfer<typeof updateProjectSchema>;
type CreateScenesPayload = ZodInfer<typeof createScenesSchema>;
type UpdateScenePayload = ZodInfer<typeof updateSceneSchema>;
type AppendChatPayload = ZodInfer<typeof appendChatMessageSchema>;
type UpsertSettingsPayload = ZodInfer<typeof upsertSettingsSchema>;
type ReorderScenesPayload = ZodInfer<typeof reorderScenesSchema>;
type CreateSceneGroupPayload = ZodInfer<typeof createSceneGroupSchema>;
type UpdateSceneGroupPayload = ZodInfer<typeof updateSceneGroupSchema>;
type AddScenesToGroupPayload = ZodInfer<typeof addScenesToGroupSchema>;
type CreateSceneTagPayload = ZodInfer<typeof createSceneTagSchema>;
type AssignTagsPayload = ZodInfer<typeof assignTagsSchema>;
type SaveDocumentPayload = ZodInfer<typeof saveDocumentSchema>;
type ExportDocumentPayload = ZodInfer<typeof exportDocumentSchema>;

const parseInclude = (value: string | undefined) => {
  if (!value) return new Set<string>();
  return new Set(value.split(",").map((item) => item.trim().toLowerCase()));
};

const normalizeSortField = (
  value: string | undefined
): ProjectSortField | undefined => {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === "name") return "name";
  if (normalized === "createdat" || normalized === "created_at") {
    return "createdAt";
  }
  if (normalized === "updatedat" || normalized === "updated_at") {
    return "updatedAt";
  }
  return undefined;
};

const normalizeSortOrder = (
  value: string | undefined
): ProjectSortOrder | undefined => {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === "asc") return "asc";
  if (normalized === "desc") return "desc";
  return undefined;
};

export const createProjectsRouter = (
  db: SqliteDatabase,
  config?: AppConfig
) => {
  const router = Router();

  router.get("/", (req, res) => {
    const sortParam =
      typeof req.query.sort === "string" ? req.query.sort : undefined;
    const orderParam =
      typeof req.query.order === "string" ? req.query.order : undefined;

    const sort = normalizeSortField(sortParam);
    if (sortParam && !sort) {
      return res.status(400).json({ error: "Invalid sort parameter" });
    }

    const order = normalizeSortOrder(orderParam);
    if (orderParam && !order) {
      return res.status(400).json({ error: "Invalid order parameter" });
    }

    const projects = listProjects(db, { sort, order });
    res.json({ projects });
  });

  router.post("/", (req, res) => {
    let data: CreateProjectPayload;
    try {
      data = createProjectSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.flatten() });
      }
      return res.status(400).json({ error: "Invalid request payload" });
    }
    const { name, description } = data;
    const project = createProject(db, { name, description });
    res.status(201).json({ project });
  });

  router.get("/search", (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!query) {
      return res.status(400).json({ error: "Query parameter q is required" });
    }

    const sortParam =
      typeof req.query.sort === "string" ? req.query.sort : undefined;
    const orderParam =
      typeof req.query.order === "string" ? req.query.order : undefined;

    const sort = normalizeSortField(sortParam);
    if (sortParam && !sort) {
      return res.status(400).json({ error: "Invalid sort parameter" });
    }

    const order = normalizeSortOrder(orderParam);
    if (orderParam && !order) {
      return res.status(400).json({ error: "Invalid order parameter" });
    }

    const projects = searchProjects(db, query, { sort, order });
    res.json({ projects });
  });

  router.get("/:projectId", (req, res) => {
    const { projectId } = req.params;
    const includes = parseInclude(req.query.include as string | undefined);
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    const includeScenes = includes.has("scenes");
    const includeChat = includes.has("chat");
    const includeSettings = includes.has("settings");
    const includeGroups = includes.has("groups");
    const includeTags = includes.has("tags");

    const payload: Record<string, unknown> = { project };

    const sceneGroupMap = new Map<string, string | null>();
    const groupScenesMap = new Map<string, string[]>();
    const sceneTagMap = new Map<string, string[]>();
    const tagScenesMap = new Map<string, string[]>();

    if (includeScenes || includeGroups) {
      const scenesWithGroups = getScenesWithGroups(db, projectId);
      for (const scene of scenesWithGroups) {
        const groupId = (scene as { groupId?: string | null }).groupId ?? null;
        sceneGroupMap.set(scene.id, groupId);
        if (groupId) {
          if (!groupScenesMap.has(groupId)) {
            groupScenesMap.set(groupId, []);
          }
          groupScenesMap.get(groupId)!.push(scene.id);
        }
      }
    }

    if (includeScenes || includeTags) {
      const scenesWithTags = getScenesWithTags(db, projectId);
      for (const scene of scenesWithTags) {
        sceneTagMap.set(scene.id, scene.tagIds ?? []);
        for (const tagId of scene.tagIds ?? []) {
          if (!tagScenesMap.has(tagId)) {
            tagScenesMap.set(tagId, []);
          }
          tagScenesMap.get(tagId)!.push(scene.id);
        }
      }
    }

    if (includeScenes) {
      const baseScenes = getScenesByProject(db, projectId);
      const enriched = enrichScenesWithAssets(db, baseScenes).map((scene) => {
        const groupId = sceneGroupMap.get(scene.id) ?? null;
        const tagIds = sceneTagMap.get(scene.id) ?? [];
        return {
          ...scene,
          groupId,
          groupIds: groupId ? [groupId] : [],
          tagIds,
        };
      });
      payload.scenes = enriched;
    }

    if (includeChat) {
      payload.chat = enrichChatMessagesWithAssets(
        db,
        getChatMessages(db, projectId)
      );
    }
    if (includeSettings) {
      payload.settings = getSettings(db, projectId);
    }
    if (includeGroups) {
      const groups = listSceneGroups(db, projectId).map((group) => ({
        ...group,
        color: group.color ?? null,
        sceneIds: groupScenesMap.get(group.id) ?? [],
      }));
      payload.groups = groups;
    }
    if (includeTags) {
      const tags = listSceneTags(db, projectId).map((tag) => ({
        ...tag,
        color: tag.color ?? null,
        sceneIds: tagScenesMap.get(tag.id) ?? [],
      }));
      payload.tags = tags;
    }
    res.json(payload);
  });

  router.patch("/:projectId", (req, res) => {
    const { projectId } = req.params;
    let updates: UpdateProjectPayload;
    try {
      updates = updateProjectSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.flatten() });
      }
      return res.status(400).json({ error: "Invalid request payload" });
    }
    const project = updateProject(db, projectId, updates);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json({ project });
  });

  router.delete("/:projectId", async (req, res) => {
    const { projectId } = req.params;
    const existing = getProjectById(db, projectId);
    if (!existing) {
      return res.status(404).json({ error: "Project not found" });
    }

    const totalProjects = countProjects(db);
    const deleted = deleteProject(db, projectId);
    if (!deleted) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Clean up uploaded files (Files API resources and local storage)
    if (config) {
      try {
        await cleanupProjectFiles(db, config, projectId);
      } catch (error) {
        console.error("[projects:delete:cleanup-error]", error);
        // Continue with deletion even if cleanup fails
      }
    }

    let replacementProject: Project | null = null;
    let nextProject: Project | null = null;

    if (totalProjects <= 1) {
      replacementProject = createProject(db, { name: "Untitled Project" });
      nextProject = replacementProject;
    } else {
      const remainingProjects = listProjects(db);
      nextProject = remainingProjects[0] ?? null;
    }

    res.json({
      deletedProjectId: projectId,
      deletedProjectName: existing.name,
      nextProject,
      replacementProject,
    });
  });

  router.post("/:projectId/scenes", (req, res) => {
    const { projectId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    let payload: CreateScenesPayload;
    try {
      payload = createScenesSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.flatten() });
      }
      return res.status(400).json({ error: "Invalid request payload" });
    }
    const scenes = createScenes(
      db,
      projectId,
      payload.scenes.map(({ description, aspectRatio, orderIndex }) => ({
        description,
        aspectRatio,
        orderIndex,
      }))
    );
    res.status(201).json({ scenes: enrichScenesWithAssets(db, scenes) });
  });

  router.patch("/:projectId/scenes/:sceneId", (req, res) => {
    const { projectId, sceneId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    let updates: UpdateScenePayload;
    try {
      updates = updateSceneSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.flatten() });
      }
      return res.status(400).json({ error: "Invalid request payload" });
    }
    const scene = updateScene(db, projectId, sceneId, updates);
    if (!scene) {
      return res.status(404).json({ error: "Scene not found" });
    }
    const [enriched] = enrichScenesWithAssets(db, [scene]);
    res.json({ scene: enriched });
  });

  router.delete("/:projectId/scenes/:sceneId", (req, res) => {
    const { projectId, sceneId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    const deleted = deleteScene(db, projectId, sceneId);
    if (!deleted) {
      return res.status(404).json({ error: "Scene not found" });
    }
    const scenes = enrichScenesWithAssets(
      db,
      getScenesByProject(db, projectId)
    );
    res.json({ scenes });
  });

  router.get("/:projectId/scenes", (req, res) => {
    const { projectId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json({
      scenes: enrichScenesWithAssets(db, getScenesByProject(db, projectId)),
    });
  });

  router.get("/:projectId/scenes/:sceneId/history", (req, res) => {
    const { projectId, sceneId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    const scene = getSceneById(db, projectId, sceneId);
    if (!scene) {
      return res.status(404).json({ error: "Scene not found" });
    }
    const history = getSceneHistory(db, sceneId);
    res.json({ history });
  });

  router.post(
    "/:projectId/scenes/:sceneId/history/:historyId/restore",
    (req, res) => {
      const { projectId, sceneId, historyId } = req.params;
      const project = getProjectById(db, projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      const scene = getSceneById(db, projectId, sceneId);
      if (!scene) {
        return res.status(404).json({ error: "Scene not found" });
      }
      const restored = restoreSceneFromHistory(
        db,
        projectId,
        sceneId,
        historyId
      );
      if (!restored) {
        return res.status(404).json({ error: "History entry not found" });
      }
      const [enriched] = enrichScenesWithAssets(db, [restored]);
      res.json({ scene: enriched });
    }
  );

  router.post("/:projectId/scenes/reorder", (req, res) => {
    const { projectId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    let payload: ReorderScenesPayload;
    try {
      payload = reorderScenesSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.flatten() });
      }
      return res.status(400).json({ error: "Invalid request payload" });
    }
    const scenes = reorderScenes(db, projectId, payload.sceneIds);
    res.json({ scenes: enrichScenesWithAssets(db, scenes) });
  });

  router.post("/:projectId/chats", (req, res) => {
    const { projectId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    let payload: AppendChatPayload;
    try {
      payload = appendChatMessageSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.flatten() });
      }
      return res.status(400).json({ error: "Invalid request payload" });
    }
    const message = appendChatMessage(db, projectId, {
      role: payload.role,
      text: payload.text,
      sceneId: payload.sceneId,
      imageAssetId: payload.imageAssetId,
    });
    const [enriched] = enrichChatMessagesWithAssets(db, [message]);
    res.status(201).json({ message: enriched });
  });

  router.get("/:projectId/chats", (req, res) => {
    const { projectId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json({
      chat: enrichChatMessagesWithAssets(db, getChatMessages(db, projectId)),
    });
  });

  router.put("/:projectId/settings", (req, res) => {
    const { projectId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    let payload: UpsertSettingsPayload;
    try {
      payload = upsertSettingsSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.flatten() });
      }
      return res.status(400).json({ error: "Invalid request payload" });
    }
    const record = upsertSettings(db, projectId, payload.data);
    res.json({ settings: record });
  });

  router.get("/:projectId/settings", (req, res) => {
    const { projectId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    const settings = getSettings(db, projectId);
    res.json({ settings });
  });

  router.get("/:projectId/assets", (req, res) => {
    const { projectId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const filters: {
      type?: "image" | "video" | "attachment";
      sceneId?: string;
    } = {};

    if (req.query.type) {
      const type = req.query.type as string;
      if (type === "image" || type === "video" || type === "attachment") {
        filters.type = type;
      }
    }

    if (req.query.sceneId) {
      filters.sceneId = req.query.sceneId as string;
    }

    const assets = listAssetsByProject(db, projectId, filters);

    // Enrich assets with URLs and thumbnailUrl
    const enrichedAssets = assets.map((asset) => ({
      ...asset,
      url: getAssetPublicUrl(asset),
      thumbnailUrl: asset.metadata?.thumbnailUrl as string | undefined,
    }));

    res.json({ assets: enrichedAssets });
  });

  // Scene Groups

  router.post("/:projectId/groups", (req, res) => {
    const { projectId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    let payload: CreateSceneGroupPayload;
    try {
      payload = createSceneGroupSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.flatten() });
      }
      return res.status(400).json({ error: "Invalid request payload" });
    }
    const group = createSceneGroup(db, projectId, payload.name, payload.color);
    res.status(201).json({
      group: {
        ...group,
        color: group.color ?? null,
        sceneIds: [],
      },
    });
  });

  router.get("/:projectId/groups", (req, res) => {
    const { projectId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    const scenesWithGroups = getScenesWithGroups(db, projectId);
    const membership = new Map<string, string[]>();
    for (const scene of scenesWithGroups) {
      const groupId = (scene as { groupId?: string | null }).groupId;
      if (!groupId) continue;
      if (!membership.has(groupId)) {
        membership.set(groupId, []);
      }
      membership.get(groupId)!.push(scene.id);
    }
    const groups = listSceneGroups(db, projectId).map((group) => ({
      ...group,
      color: group.color ?? null,
      sceneIds: membership.get(group.id) ?? [],
    }));
    res.json({ groups });
  });

  router.patch("/:projectId/groups/:groupId", (req, res) => {
    const { projectId, groupId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    let updates: UpdateSceneGroupPayload;
    try {
      updates = updateSceneGroupSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.flatten() });
      }
      return res.status(400).json({ error: "Invalid request payload" });
    }
    const group = updateSceneGroup(db, groupId, updates);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    const scenesWithGroups = getScenesWithGroups(db, projectId);
    const sceneIds = scenesWithGroups
      .filter(
        (scene) => (scene as { groupId?: string | null }).groupId === groupId
      )
      .map((scene) => scene.id);
    res.json({
      group: {
        ...group,
        color: group.color ?? null,
        sceneIds,
      },
    });
  });

  router.delete("/:projectId/groups/:groupId", (req, res) => {
    const { projectId, groupId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    const deleted = deleteSceneGroup(db, groupId);
    if (!deleted) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.json({ success: true });
  });

  router.post("/:projectId/groups/:groupId/scenes", (req, res) => {
    const { projectId, groupId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    let payload: AddScenesToGroupPayload;
    try {
      payload = addScenesToGroupSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.flatten() });
      }
      return res.status(400).json({ error: "Invalid request payload" });
    }
    addScenesToGroup(db, groupId, payload.sceneIds);
    res.json({ success: true });
  });

  router.delete("/:projectId/groups/:groupId/scenes", (req, res) => {
    const { projectId, groupId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    let payload: AddScenesToGroupPayload;
    try {
      payload = addScenesToGroupSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.flatten() });
      }
      return res.status(400).json({ error: "Invalid request payload" });
    }
    removeScenesFromGroup(db, groupId, payload.sceneIds);
    res.json({ success: true });
  });

  // Scene Tags

  router.post("/:projectId/tags", (req, res) => {
    const { projectId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    let payload: CreateSceneTagPayload;
    try {
      payload = createSceneTagSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.flatten() });
      }
      return res.status(400).json({ error: "Invalid request payload" });
    }
    const tag = createSceneTag(db, projectId, payload.name, payload.color);
    res.status(201).json({
      tag: {
        ...tag,
        color: tag.color ?? null,
        sceneIds: [],
      },
    });
  });

  router.delete("/:projectId/tags/:tagId", (req, res) => {
    const { projectId, tagId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    const deleted = deleteSceneTag(db, tagId);
    if (!deleted) {
      return res.status(404).json({ error: "Tag not found" });
    }
    res.json({ success: true });
  });

  router.get("/:projectId/tags", (req, res) => {
    const { projectId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    const scenesWithTags = getScenesWithTags(db, projectId);
    const membership = new Map<string, string[]>();
    for (const scene of scenesWithTags) {
      for (const tagId of scene.tagIds ?? []) {
        if (!membership.has(tagId)) {
          membership.set(tagId, []);
        }
        membership.get(tagId)!.push(scene.id);
      }
    }
    const tags = listSceneTags(db, projectId).map((tag) => ({
      ...tag,
      color: tag.color ?? null,
      sceneIds: membership.get(tag.id) ?? [],
    }));
    res.json({ tags });
  });

  router.post("/:projectId/scenes/:sceneId/tags", (req, res) => {
    const { projectId, sceneId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    let payload: AssignTagsPayload;
    try {
      payload = assignTagsSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.flatten() });
      }
      return res.status(400).json({ error: "Invalid request payload" });
    }
    assignTagsToScene(db, sceneId, payload.tagIds);
    res.json({ success: true });
  });

  router.delete("/:projectId/scenes/:sceneId/tags", (req, res) => {
    const { projectId, sceneId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    let payload: AssignTagsPayload;
    try {
      payload = assignTagsSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.flatten() });
      }
      return res.status(400).json({ error: "Invalid request payload" });
    }
    removeTagsFromScene(db, sceneId, payload.tagIds);
    res.json({ success: true });
  });

  // Document Management

  /**
   * GET /api/projects/:projectId/document
   * Get the latest document for a project
   */
  router.get("/:projectId/document", (req, res) => {
    const { projectId } = req.params;

    try {
      const document = getProjectDocument(db, projectId);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      res.json({ document });
    } catch (error) {
      const apiError = error as { statusCode?: number; errorCode?: string };
      const status = apiError.statusCode ?? 500;
      const message =
        error instanceof Error ? error.message : "Internal server error";
      res.status(status).json({
        error: message,
        errorCode: apiError.errorCode,
      });
    }
  });

  /**
   * PUT /api/projects/:projectId/document
   * Save a new version of the document
   */
  router.put("/:projectId/document", (req, res) => {
    const { projectId } = req.params;

    let payload: SaveDocumentPayload;
    try {
      payload = saveDocumentSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.flatten() });
      }
      return res.status(400).json({ error: "Invalid request payload" });
    }

    try {
      const document = saveProjectDocument(db, projectId, payload.content);
      res.json({ document });
    } catch (error) {
      const apiError = error as { statusCode?: number; errorCode?: string };
      const status = apiError.statusCode ?? 500;
      const message =
        error instanceof Error ? error.message : "Internal server error";
      res.status(status).json({
        error: message,
        errorCode: apiError.errorCode,
      });
    }
  });

  /**
   * GET /api/projects/:projectId/document/history
   * Get document version history
   */
  router.get("/:projectId/document/history", (req, res) => {
    const { projectId } = req.params;

    try {
      const history = getProjectDocumentHistory(db, projectId);
      res.json({ history });
    } catch (error) {
      const apiError = error as { statusCode?: number; errorCode?: string };
      const status = apiError.statusCode ?? 500;
      const message =
        error instanceof Error ? error.message : "Internal server error";
      res.status(status).json({
        error: message,
        errorCode: apiError.errorCode,
      });
    }
  });

  /**
   * POST /api/projects/:projectId/document/restore/:version
   * Restore a previous version of the document
   */
  router.post("/:projectId/document/restore/:version", (req, res) => {
    const { projectId, version } = req.params;
    const versionNumber = parseInt(version, 10);

    if (isNaN(versionNumber) || versionNumber < 1) {
      return res.status(400).json({ error: "Invalid version number" });
    }

    try {
      const document = restoreProjectDocumentVersion(
        db,
        projectId,
        versionNumber
      );
      if (!document) {
        return res.status(404).json({ error: "Version not found" });
      }

      res.json({ document });
    } catch (error) {
      const apiError = error as { statusCode?: number; errorCode?: string };
      const status = apiError.statusCode ?? 500;
      const message =
        error instanceof Error ? error.message : "Internal server error";
      res.status(status).json({
        error: message,
        errorCode: apiError.errorCode,
      });
    }
  });

  /**
   * POST /api/projects/:projectId/document/export
   * Export document in various formats
   */
  router.post("/:projectId/document/export", (req, res) => {
    const { projectId } = req.params;

    let payload: ExportDocumentPayload;
    try {
      payload = exportDocumentSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.flatten() });
      }
      return res.status(400).json({ error: "Invalid request payload" });
    }

    try {
      const { buffer, mimeType, filename } = exportProjectDocument(
        db,
        projectId,
        payload.format as ExportFormat,
        payload.includeAssets ?? false
      );

      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(buffer);
    } catch (error) {
      const apiError = error as { statusCode?: number; errorCode?: string };
      const status = apiError.statusCode ?? 500;
      const message =
        error instanceof Error ? error.message : "Internal server error";
      res.status(status).json({
        error: message,
        errorCode: apiError.errorCode,
      });
    }
  });

  // Get project statistics including total duration
  router.get("/:projectId/stats", (req, res) => {
    const { projectId } = req.params;
    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const scenes = getScenesByProject(db, projectId);
    const totalDuration = scenes.reduce(
      (sum, scene) => sum + (scene.duration || 0),
      0
    );
    const sceneCount = scenes.length;

    res.json({
      projectId,
      sceneCount,
      totalDuration,
      totalDurationFormatted: formatDuration(totalDuration),
    });
  });

  return router;
};
