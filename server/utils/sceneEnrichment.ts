import type { UnifiedDatabase } from "../database";
import { getAssetsByIds } from "../stores/assetStore";
import { updateScene } from "../stores/sceneStore";
import type { Scene, ChatMessage, Asset } from "../types";
import { assetFileExists, getAssetPublicUrl } from "./assetHelpers";

export const enrichScenesWithAssets = async (
  db: UnifiedDatabase,
  scenes: Scene[]
): Promise<
  Array<
    Scene & {
      primaryImageAssetId: string | null;
      primaryVideoAssetId: string | null;
      imageUrl: string | null;
      videoUrl: string | null;
      imageStatus: "ready" | "missing" | "absent";
      videoStatus: "ready" | "missing" | "absent";
      imageAsset: Asset | null;
      videoAsset: Asset | null;
    }
  >
> => {
  if (scenes.length === 0) {
    return [];
  }

  const assetIds = Array.from(
    new Set(
      scenes
        .flatMap((scene) => [
          scene.primaryImageAssetId,
          scene.primaryVideoAssetId,
        ])
        .filter((value): value is string => Boolean(value))
    )
  );
  const assets = assetIds.length > 0 ? await getAssetsByIds(db, assetIds) : [];
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

  const missingImageScenes = new Set<string>();
  const missingVideoScenes = new Set<string>();

  const enriched = scenes.map((scene) => {
    const imageAsset = scene.primaryImageAssetId
      ? assetMap.get(scene.primaryImageAssetId)
      : undefined;
    const videoAsset = scene.primaryVideoAssetId
      ? assetMap.get(scene.primaryVideoAssetId)
      : undefined;

    let imageStatus: "ready" | "missing" | "absent" = "absent";
    let videoStatus: "ready" | "missing" | "absent" = "absent";
    let imageUrl: string | null = null;
    let videoUrl: string | null = null;
    let primaryImageAssetId = scene.primaryImageAssetId ?? null;
    let primaryVideoAssetId = scene.primaryVideoAssetId ?? null;

    if (scene.primaryImageAssetId) {
      if (imageAsset && assetFileExists(imageAsset)) {
        imageStatus = "ready";
        imageUrl = getAssetPublicUrl(imageAsset);
      } else {
        imageStatus = "missing";
        primaryImageAssetId = null;
        missingImageScenes.add(scene.id);
      }
    }

    if (scene.primaryVideoAssetId) {
      if (videoAsset && assetFileExists(videoAsset)) {
        videoStatus = "ready";
        videoUrl = getAssetPublicUrl(videoAsset);
      } else {
        videoStatus = "missing";
        primaryVideoAssetId = null;
        missingVideoScenes.add(scene.id);
      }
    }

    return {
      ...scene,
      primaryImageAssetId,
      primaryVideoAssetId,
      imageUrl,
      videoUrl,
      imageStatus,
      videoStatus,
      imageAsset: imageAsset ?? null,
      videoAsset: videoAsset ?? null,
    };
  });

  if (missingImageScenes.size > 0) {
    for (const sceneId of missingImageScenes) {
      const scene = scenes.find((candidate) => candidate.id === sceneId);
      if (!scene) continue;
      await updateScene(db, scene.projectId, scene.id, { primaryImageAssetId: null });
      console.warn(
        `Pruned missing image asset reference for scene ${scene.id}`
      );
    }
  }

  if (missingVideoScenes.size > 0) {
    for (const sceneId of missingVideoScenes) {
      const scene = scenes.find((candidate) => candidate.id === sceneId);
      if (!scene) continue;
      await updateScene(db, scene.projectId, scene.id, { primaryVideoAssetId: null });
      console.warn(
        `Pruned missing video asset reference for scene ${scene.id}`
      );
    }
  }

  return enriched;
};

export const enrichSceneWithAssets = async (
  db: UnifiedDatabase,
  scene: Scene
): Promise<Awaited<ReturnType<typeof enrichScenesWithAssets>>[number]> => {
  const [enriched] = await enrichScenesWithAssets(db, [scene]);
  return enriched;
};

export const enrichChatMessagesWithAssets = async (
  db: UnifiedDatabase,
  messages: ChatMessage[]
): Promise<Array<ChatMessage & { imageUrl: string | null }>> => {
  if (messages.length === 0) {
    return [];
  }
  const assetIds = Array.from(
    new Set(
      messages
        .map((message) => message.imageAssetId)
        .filter((id): id is string => Boolean(id))
    )
  );
  const assets = assetIds.length > 0 ? await getAssetsByIds(db, assetIds) : [];
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

  return messages.map((message) => {
    const asset = message.imageAssetId
      ? assetMap.get(message.imageAssetId)
      : undefined;
    return {
      ...message,
      imageUrl:
        asset && assetFileExists(asset) ? getAssetPublicUrl(asset) : null,
    };
  });
};
