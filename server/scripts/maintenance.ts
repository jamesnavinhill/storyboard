#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { db } from "../db";
import { getConfig } from "../config";
import { listAssets, deleteAsset } from "../stores/assetStore";
import {
  getProjectById,
  getScenesByProject,
  getChatMessages,
  getSettings,
} from "../stores/projectStore";

const usage = () => {
  // eslint-disable-next-line no-console
  console.log(`Usage:
  npm run maintain prune
  npm run maintain export <projectId> [outputDir]
  `);
};

const pruneOrphanedAssets = () => {
  const config = getConfig();
  const assetsRoot = path.join(config.dataDir, "assets");
  fs.mkdirSync(assetsRoot, { recursive: true });

  const assets = listAssets(db);
  const referencedFiles = new Set<string>(
    assets.map((asset) => path.resolve(asset.filePath))
  );

  const missingAssets = assets.filter((asset) => {
    try {
      fs.accessSync(asset.filePath, fs.constants.F_OK);
      return false;
    } catch (_error) {
      return true;
    }
  });

  for (const asset of missingAssets) {
    // eslint-disable-next-line no-console
    console.warn(`Deleting asset ${asset.id} (missing file)`);
    db.prepare(
      `UPDATE scenes SET primary_image_asset_id = NULL WHERE primary_image_asset_id = ?`
    ).run(asset.id);
    db.prepare(
      `UPDATE scenes SET primary_video_asset_id = NULL WHERE primary_video_asset_id = ?`
    ).run(asset.id);
    db.prepare(
      `UPDATE chat_messages SET image_asset_id = NULL WHERE image_asset_id = ?`
    ).run(asset.id);
    deleteAsset(db, config, asset.id);
  }

  const walkFiles = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkFiles(fullPath);
        if (fs.readdirSync(fullPath).length === 0) {
          fs.rmdirSync(fullPath);
        }
        continue;
      }
      if (!referencedFiles.has(fullPath)) {
        // eslint-disable-next-line no-console
        console.warn(`Removing unreferenced file ${fullPath}`);
        fs.rmSync(fullPath);
      }
    }
  };

  walkFiles(assetsRoot);

  // eslint-disable-next-line no-console
  console.log("Asset maintenance complete.");
};

const exportProject = (projectId: string, targetDir: string) => {
  const project = getProjectById(db, projectId);
  if (!project) {
    throw new Error(`Project ${projectId} not found.`);
  }
  const config = getConfig();
  const assetsRoot = path.join(config.dataDir, "assets");
  const scenes = getScenesByProject(db, projectId);
  const chat = getChatMessages(db, projectId);
  const settings = getSettings(db, projectId);
  const assets = listAssets(db).filter(
    (asset) => asset.projectId === projectId
  );

  const baseDir = path.resolve(targetDir);
  fs.mkdirSync(baseDir, { recursive: true });
  const projectDir = path.join(baseDir, projectId);
  const projectAssetsDir = path.join(projectDir, "assets");
  fs.mkdirSync(projectAssetsDir, { recursive: true });

  const assetPayload = assets.map((asset) => {
    const relative = path.relative(assetsRoot, asset.filePath);
    const destination = path.join(projectAssetsDir, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    try {
      fs.copyFileSync(asset.filePath, destination);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        `Failed to copy asset ${asset.id} (${asset.filePath}): ${String(error)}`
      );
    }
    return {
      id: asset.id,
      sceneId: asset.sceneId,
      type: asset.type,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
      size: asset.size,
      checksum: asset.checksum,
      metadata: asset.metadata,
      relativePath: relative,
    };
  });

  const exportPayload = {
    project,
    scenes,
    chat,
    settings,
    assets: assetPayload,
    exportedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(projectDir, "project.json"),
    JSON.stringify(exportPayload, null, 2),
    "utf8"
  );

  // eslint-disable-next-line no-console
  console.log(
    `Project ${projectId} exported to ${projectDir} with ${assetPayload.length} assets.`
  );
};

const main = () => {
  const [, , command, ...rest] = process.argv;
  if (!command || command === "--help" || command === "-h") {
    usage();
    process.exit(0);
  }

  if (command === "prune") {
    pruneOrphanedAssets();
    process.exit(0);
  }

  if (command === "export") {
    const [projectId, targetDir] = rest;
    if (!projectId) {
      usage();
      process.exit(1);
    }
    exportProject(projectId, targetDir ?? path.join(process.cwd(), "exports"));
    process.exit(0);
  }

  usage();
  process.exit(1);
};

main();
