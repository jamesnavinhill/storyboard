import fs from "node:fs";
import path from "node:path";
import archiver from "archiver";
import type { UnifiedDatabase } from "../database";
import type { AppConfig } from "../config";
import { getProjectById, getSettings } from "../stores/projectStore";
import {
  getScenesByProject,
  getScenesWithGroups,
  getScenesWithTags,
} from "../stores/sceneStore";
import { getChatMessages } from "../stores/chatStore";
import { listAssetsByProject } from "../stores/assetStore";
import { listSceneGroups } from "../stores/groupStore";
import { listSceneTags } from "../stores/tagStore";

export interface ExportManifest {
  manifestVersion: number;
  project: {
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  scenes: Array<{
    id: string;
    description: string;
    aspectRatio: "16:9" | "9:16" | "1:1";
    orderIndex: number;
    primaryImageAssetId?: string | null;
    primaryVideoAssetId?: string | null;
    groupId?: string | null;
    tagIds?: string[];
    createdAt: string;
    updatedAt: string;
  }>;
  chatMessages: Array<{
    id: string;
    sceneId?: string | null;
    role: "user" | "model";
    text: string;
    imageAssetId?: string | null;
    createdAt: string;
  }>;
  assets: Array<{
    id: string;
    sceneId?: string | null;
    type: "image" | "video" | "attachment";
    mimeType: string;
    fileName: string;
    filePath: string;
    size: number;
    checksum?: string | null;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
  }>;
  groups: Array<{
    id: string;
    name: string;
    color?: string | null;
    orderIndex: number;
    createdAt: string;
  }>;
  tags: Array<{
    id: string;
    name: string;
    color?: string | null;
  }>;
  settings?: unknown;
}

/**
 * Export a project to a ZIP archive streamed to the provided output stream.
 * The ZIP contains:
 * - project.json (project metadata, scenes, chat, settings)
 * - assets/ folder with all image/video files
 */
export const exportProject = async (
  db: UnifiedDatabase,
  config: AppConfig,
  projectId: string
): Promise<archiver.Archiver> => {
  const project = await getProjectById(db, projectId);
  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const scenes = await getScenesByProject(db, projectId);
  const chatMessages = await getChatMessages(db, projectId);
  const assets = await listAssetsByProject(db, projectId);
  const settings = await getSettings(db, projectId);
  const groups = await listSceneGroups(db, projectId);
  const tags = await listSceneTags(db, projectId);

  // Get group and tag associations
  const scenesWithGroups = await getScenesWithGroups(db, projectId);
  const scenesWithTags = await getScenesWithTags(db, projectId);

  // Create a map for quick lookup
  const sceneGroupMap = new Map(scenesWithGroups.map((s) => [s.id, s.groupId]));
  const sceneTagMap = new Map(scenesWithTags.map((s) => [s.id, s.tagIds]));

  // Build manifest
  const manifest: ExportManifest = {
    manifestVersion: 1,
    project: {
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
    scenes: scenes.map((scene) => ({
      id: scene.id,
      description: scene.description,
      aspectRatio: scene.aspectRatio,
      orderIndex: scene.orderIndex,
      primaryImageAssetId: scene.primaryImageAssetId,
      primaryVideoAssetId: scene.primaryVideoAssetId,
      groupId: sceneGroupMap.get(scene.id) ?? null,
      tagIds: sceneTagMap.get(scene.id) ?? [],
      createdAt: scene.createdAt,
      updatedAt: scene.updatedAt,
    })),
    chatMessages: chatMessages.map((msg) => ({
      id: msg.id,
      sceneId: msg.sceneId,
      role: msg.role,
      text: msg.text,
      imageAssetId: msg.imageAssetId,
      createdAt: msg.createdAt,
    })),
    assets: assets.map((asset) => ({
      id: asset.id,
      sceneId: asset.sceneId,
      type: asset.type,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
      filePath: asset.filePath,
      size: asset.size,
      checksum: asset.checksum,
      metadata: asset.metadata,
      createdAt: asset.createdAt,
    })),
    groups: groups.map((group) => ({
      id: group.id,
      name: group.name,
      color: group.color,
      orderIndex: group.orderIndex,
      createdAt: group.createdAt,
    })),
    tags: tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    })),
    settings: settings?.data,
  };

  // Create archive
  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  // Add project.json
  archive.append(JSON.stringify(manifest, null, 2), {
    name: "project.json",
  });

  // Add asset files
  for (const asset of assets) {
    if (fs.existsSync(asset.filePath)) {
      const relativePath = path.join(
        "assets",
        asset.id + path.extname(asset.fileName)
      );
      archive.file(asset.filePath, { name: relativePath });
    }
  }

  // Finalize the archive
  await archive.finalize();

  return archive;
};
