import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import type { UnifiedDatabase } from "../database";
import type { AppConfig } from "../config";
import type { ExportManifest } from "./projectExport";
import {
  createProject,
  listProjects,
  upsertSettings,
} from "../stores/projectStore";
import { createScenes } from "../stores/sceneStore";
import { appendChatMessage } from "../stores/chatStore";
import { createSceneGroup, addScenesToGroup } from "../stores/groupStore";
import { createSceneTag, assignTagsToScene } from "../stores/tagStore";
import { createAsset } from "../stores/assetStore";

interface ImportResult {
  projectId: string;
  projectName: string;
  sceneCount: number;
  assetCount: number;
  chatMessageCount: number;
}

/**
 * Import a project from a ZIP buffer.
 * Validates structure, generates new UUIDs, copies assets, and inserts into database.
 * Returns a summary of the imported project.
 */
export const importProject = async (
  db: UnifiedDatabase,
  config: AppConfig,
  zipBuffer: Buffer
): Promise<ImportResult> => {
  // Load and extract ZIP
  const zip = await JSZip.loadAsync(zipBuffer);

  // Read and validate project.json
  const projectJsonFile = zip.file("project.json");
  if (!projectJsonFile) {
    throw new Error("Invalid project archive: missing project.json");
  }

  const projectJsonText = await projectJsonFile.async("text");
  const manifest: ExportManifest = JSON.parse(projectJsonText);

  // Validate manifest version
  if (!manifest.manifestVersion || manifest.manifestVersion !== 1) {
    throw new Error(
      `Unsupported manifest version: ${manifest.manifestVersion ?? "unknown"}`
    );
  }

  // Resolve name conflicts
  const existingProjects = await listProjects(db);
  const existingNames = new Set(
    existingProjects.map((p) => p.name.toLowerCase())
  );
  let projectName = manifest.project.name;
  let nameCounter = 1;

  while (existingNames.has(projectName.toLowerCase())) {
    projectName = `${manifest.project.name} (${nameCounter})`;
    nameCounter++;
  }

  // Generate new UUIDs
  const newProjectId = randomUUID();
  const sceneIdMap = new Map<string, string>();
  const assetIdMap = new Map<string, string>();
  const chatIdMap = new Map<string, string>();
  const groupIdMap = new Map<string, string>();
  const tagIdMap = new Map<string, string>();

  for (const scene of manifest.scenes) {
    sceneIdMap.set(scene.id, randomUUID());
  }

  for (const asset of manifest.assets) {
    assetIdMap.set(asset.id, randomUUID());
  }

  for (const message of manifest.chatMessages) {
    chatIdMap.set(message.id, randomUUID());
  }

  for (const group of manifest.groups) {
    groupIdMap.set(group.id, randomUUID());
  }

  for (const tag of manifest.tags) {
    tagIdMap.set(tag.id, randomUUID());
  }

  // Create project
  const project = await createProject(db, {
    name: projectName,
    description: manifest.project.description ?? undefined,
  });

  // Create asset directory for new project
  const projectAssetsDir = path.join(config.dataDir, "assets", project.id);
  if (!fs.existsSync(projectAssetsDir)) {
    fs.mkdirSync(projectAssetsDir, { recursive: true });
  }

  // Import assets
  for (const asset of manifest.assets) {
    const newAssetId = assetIdMap.get(asset.id)!;
    const assetFileName = newAssetId + path.extname(asset.fileName);
    const assetRelativePath = path.join(
      "assets",
      asset.id + path.extname(asset.fileName)
    );
    const assetFile = zip.file(assetRelativePath);

    if (!assetFile) {
      console.warn(`Asset file not found in archive: ${assetRelativePath}`);
      continue;
    }

    // Extract asset file
    const assetBuffer = await assetFile.async("nodebuffer");
    const newAssetPath = path.join(projectAssetsDir, assetFileName);
    fs.writeFileSync(newAssetPath, assetBuffer);

    // Create asset record
    await createAsset(db, {
      projectId: project.id,
      sceneId: asset.sceneId ? sceneIdMap.get(asset.sceneId) : undefined,
      type: asset.type,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
      filePath: newAssetPath,
      size: asset.size,
      checksum: asset.checksum ?? undefined,
      metadata: asset.metadata ?? undefined,
    });
  }

  // Import groups
  for (const group of manifest.groups) {
    await createSceneGroup(db, project.id, group.name, group.color ?? undefined);
  }

  // Import tags
  for (const tag of manifest.tags) {
    await createSceneTag(db, project.id, tag.name, tag.color ?? undefined);
  }

  // Import scenes
  const sceneInputs = manifest.scenes.map((scene) => ({
    description: scene.description,
    aspectRatio: scene.aspectRatio,
    orderIndex: scene.orderIndex,
  }));

  const createdScenes = await createScenes(db, project.id, sceneInputs);

  // Update scene asset references
  for (let i = 0; i < manifest.scenes.length; i++) {
    const oldScene = manifest.scenes[i];
    const newScene = createdScenes[i];

    if (oldScene.primaryImageAssetId || oldScene.primaryVideoAssetId) {
      const updateFields: string[] = [];
      const params: unknown[] = [];

      if (oldScene.primaryImageAssetId) {
        const newImageAssetId = assetIdMap.get(oldScene.primaryImageAssetId);
        if (newImageAssetId) {
          updateFields.push("primary_image_asset_id = ?");
          params.push(newImageAssetId);
        }
      }

      if (oldScene.primaryVideoAssetId) {
        const newVideoAssetId = assetIdMap.get(oldScene.primaryVideoAssetId);
        if (newVideoAssetId) {
          updateFields.push("primary_video_asset_id = ?");
          params.push(newVideoAssetId);
        }
      }

      if (updateFields.length > 0) {
        params.push(newScene.id);
        const sql = `UPDATE scenes SET ${updateFields.join(", ")} WHERE id = ?`;
        await db.execute(sql, params);
      }
    }

    // Assign groups
    if (oldScene.groupId) {
      const newGroupId = groupIdMap.get(oldScene.groupId);
      if (newGroupId) {
        await addScenesToGroup(db, newGroupId, [newScene.id]);
      }
    }

    // Assign tags
    if (oldScene.tagIds && oldScene.tagIds.length > 0) {
      const newTagIds = oldScene.tagIds
        .map((oldTagId) => tagIdMap.get(oldTagId))
        .filter((id): id is string => id !== undefined);
      if (newTagIds.length > 0) {
        await assignTagsToScene(db, newScene.id, newTagIds);
      }
    }
  }

  // Import chat messages
  for (const message of manifest.chatMessages) {
    const newSceneId = message.sceneId
      ? sceneIdMap.get(message.sceneId)
      : undefined;
    const newImageAssetId = message.imageAssetId
      ? assetIdMap.get(message.imageAssetId)
      : undefined;

    await appendChatMessage(db, project.id, {
      role: message.role,
      text: message.text,
      sceneId: newSceneId,
      imageAssetId: newImageAssetId,
    });
  }

  // Import settings
  if (manifest.settings) {
    await upsertSettings(db, project.id, manifest.settings);
  }

  return {
    projectId: project.id,
    projectName: project.name,
    sceneCount: createdScenes.length,
    assetCount: manifest.assets.length,
    chatMessageCount: manifest.chatMessages.length,
  };
};
