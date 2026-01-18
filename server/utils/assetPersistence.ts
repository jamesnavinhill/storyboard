import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import type { UnifiedDatabase } from "../database";
import type { AppConfig } from "../config";
import { createAsset } from "../stores/assetStore";
import { updateScene } from "../stores/sceneStore";
import type { Asset } from "../types";

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

const sanitizeFileName = (fileName: string): string => {
  const base = path.basename(fileName);
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 128);
  return cleaned.length > 0 ? cleaned : `asset-${Date.now()}`;
};

const ensureExtension = (fileName: string, ext: string): string => {
  if (!ext) {
    return fileName;
  }
  const normalized = ext.startsWith(".") ? ext.slice(1) : ext;
  if (fileName.toLowerCase().endsWith(`.${normalized.toLowerCase()}`)) {
    return fileName;
  }
  return `${fileName}.${normalized}`;
};

export const extensionFromMime = (
  mimeType: string,
  fallback = "bin"
): string => {
  const [type] = mimeType.split(";");
  return MIME_EXTENSION_MAP[type] ?? fallback;
};

export interface PersistAssetOptions {
  db: UnifiedDatabase;
  config: AppConfig;
  projectId: string;
  sceneId?: string;
  type: Asset["type"];
  mimeType: string;
  buffer: Buffer;
  metadata?: Record<string, unknown> | null;
  fileName?: string;
}

export interface PersistAssetResult {
  asset: Asset;
  filePath: string;
}

export const persistAssetBuffer = async (
  options: PersistAssetOptions
): Promise<PersistAssetResult> => {
  const {
    db,
    config,
    projectId,
    sceneId,
    type,
    mimeType,
    buffer,
    metadata,
    fileName,
  } = options;
  const checksum = createHash("sha256").update(buffer).digest("hex");
  const ext = extensionFromMime(mimeType);
  const targetName = fileName ? sanitizeFileName(fileName) : undefined;
  const finalName = ensureExtension(
    targetName ?? `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`,
    ext
  );

  const assetsRoot = path.join(config.dataDir, "assets");
  const projectDir = path.join(assetsRoot, projectId);
  fs.mkdirSync(projectDir, { recursive: true });
  const filePath = path.join(projectDir, finalName);
  fs.writeFileSync(filePath, buffer);

  const asset = await createAsset(db, {
    projectId,
    sceneId,
    type,
    mimeType,
    fileName: finalName,
    filePath,
    size: buffer.length,
    checksum,
    metadata: metadata ?? null,
  });

  if (sceneId) {
    if (type === "image") {
      await updateScene(db, projectId, sceneId, { primaryImageAssetId: asset.id });
    }
    if (type === "video") {
      await updateScene(db, projectId, sceneId, { primaryVideoAssetId: asset.id });
    }
  }

  return { asset, filePath };
};
