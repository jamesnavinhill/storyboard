import { Router } from "express";
import type { Database as SqliteDatabase } from "better-sqlite3";
import { createAssetSchema, updateAssetSchema } from "../validation";
import { getAssetById, updateAsset, deleteAsset } from "../stores/assetStore";
import { getProjectById, getSceneById } from "../stores/projectStore";
import type { AppConfig } from "../config";
import { getAssetPublicUrl } from "../utils/assetHelpers";
import { persistAssetBuffer } from "../utils/assetPersistence";

export const createAssetsRouter = (db: SqliteDatabase, config: AppConfig) => {
  const router = Router();

  router.post("/", (req, res) => {
    const parsed = createAssetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { projectId, sceneId, type, mimeType, fileName, data, metadata } =
      parsed.data;

    const project = getProjectById(db, projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (sceneId) {
      const scene = getSceneById(db, projectId, sceneId);
      if (!scene) {
        return res.status(404).json({ error: "Scene not found" });
      }
    }

    const buffer = Buffer.from(data, "base64");
    const { asset } = persistAssetBuffer({
      db,
      config,
      projectId,
      sceneId,
      type,
      mimeType,
      buffer,
      metadata: metadata ?? null,
      fileName,
    });

    res.status(201).json({
      asset,
      url: getAssetPublicUrl(asset),
    });
  });

  router.get("/:assetId", (req, res) => {
    const { assetId } = req.params;
    const asset = getAssetById(db, assetId);
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }
    res.json({
      asset,
      url: getAssetPublicUrl(asset),
    });
  });

  router.patch("/:assetId", (req, res) => {
    const { assetId } = req.params;
    const parsed = updateAssetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const asset = getAssetById(db, assetId);
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    const updatedAsset = updateAsset(db, assetId, parsed.data);
    if (!updatedAsset) {
      return res.status(500).json({ error: "Failed to update asset" });
    }

    res.json({
      asset: updatedAsset,
      url: getAssetPublicUrl(updatedAsset),
    });
  });

  router.delete("/:assetId", (req, res) => {
    const { assetId } = req.params;
    const asset = getAssetById(db, assetId);
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    deleteAsset(db, config, assetId);
    res.status(204).send();
  });

  return router;
};
