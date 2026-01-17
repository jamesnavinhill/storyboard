import fs from "node:fs";
import path from "node:path";
import type { Asset } from "../types";
import { getConfig } from "../config";

export const getAssetPublicUrl = (asset: Asset): string => {
  const config = getConfig();
  const assetsRoot = path.join(config.dataDir, "assets");
  const relativePath = path
    .relative(assetsRoot, asset.filePath)
    .replace(/\\/g, "/");
  return `/api/assets/files/${relativePath}`;
};

export const assetFileExists = (asset: Asset): boolean => {
  try {
    fs.accessSync(asset.filePath, fs.constants.F_OK);
    return true;
  } catch (_error) {
    return false;
  }
};
