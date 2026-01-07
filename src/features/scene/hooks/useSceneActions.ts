import { useCallback } from "react";
import { useServices } from "../../../services/registry";
import { useToast } from "../../../components/toast/useToast";
import type { Scene } from "../../../types";
import type { SceneRecord } from "../../../types/services";

export interface SceneActions {
  // CRUD operations
  updateScene: (
    sceneId: string,
    updates: Partial<
      { description: string; aspectRatio: "16:9" | "9:16" | "1:1" } & {
        primaryImageAssetId?: string | null;
        primaryVideoAssetId?: string | null;
      }
    >
  ) => Promise<void>;
  duplicateScene: (sceneId: string) => Promise<void>;
  deleteScene: (sceneId: string) => Promise<void>;
  createManualScene: (
    description: string,
    aspectRatio: "16:9" | "9:16" | "1:1"
  ) => Promise<string>; // returns created scene id

  // Group assignment
  assignGroup: (sceneId: string, groupId: string | null) => Promise<void>;

  // Tag operations
  addTag: (sceneId: string, tagId: string) => Promise<void>;
  removeTag: (sceneId: string, tagId: string) => Promise<void>;

  // Reordering
  reorderScenes: (sceneIds: string[]) => Promise<void>;

  // Export
  exportImage: (imageUrl: string, description: string) => void;
  exportAllImages: (scenes: Scene[]) => void;
}

export interface UseSceneActionsOptions {
  activeProjectId: string | null;
  scenes: Scene[];
  updateSceneRecord: (record: SceneRecord) => void;
  duplicateScene: (sceneId: string) => Promise<void>;
  deleteScene: (sceneId: string) => Promise<void>;
  createManualScene: (
    description: string,
    aspectRatio: "16:9" | "9:16" | "1:1"
  ) => Promise<string>;
  assignScenesToGroup: (groupId: string, sceneIds: string[]) => Promise<void>;
  removeScenesFromGroup: (groupId: string, sceneIds: string[]) => Promise<void>;
  assignTagsToScene: (sceneId: string, tagIds: string[]) => Promise<void>;
  removeTagsFromScene: (sceneId: string, tagIds: string[]) => Promise<void>;
  reorderScenes: (sceneIds: string[]) => Promise<void>;
}

export const useSceneActions = (
  options: UseSceneActionsOptions
): SceneActions => {
  const {
    activeProjectId,
    scenes,
    updateSceneRecord,
    duplicateScene: storeDuplicateScene,
    deleteScene: storeDeleteScene,
    createManualScene: storeCreateManualScene,
    assignScenesToGroup,
    removeScenesFromGroup,
    assignTagsToScene,
    removeTagsFromScene,
    reorderScenes: storeReorderScenes,
  } = options;

  const { projectStorage } = useServices();
  const { show: showToast } = useToast();

  const updateScene = useCallback(
    async (
      sceneId: string,
      updates: Partial<
        { description: string; aspectRatio: "16:9" | "9:16" | "1:1" } & {
          primaryImageAssetId?: string | null;
          primaryVideoAssetId?: string | null;
        }
      >
    ) => {
      if (!activeProjectId) return;
      try {
        const updated = await projectStorage.updateScene(
          activeProjectId,
          sceneId,
          updates
        );
        updateSceneRecord(updated);
        showToast({ variant: "success", description: "Scene updated" });
      } catch (error) {
        console.error("Failed to update scene", error);
        showToast({ variant: "error", description: "Update failed" });
      }
    },
    [activeProjectId, projectStorage, updateSceneRecord, showToast]
  );

  const duplicateScene = useCallback(
    async (sceneId: string) => {
      await storeDuplicateScene(sceneId);
    },
    [storeDuplicateScene]
  );

  const deleteScene = useCallback(
    async (sceneId: string) => {
      await storeDeleteScene(sceneId);
    },
    [storeDeleteScene]
  );

  const createManualScene = useCallback(
    async (description: string, aspectRatio: "16:9" | "9:16" | "1:1") => {
      return storeCreateManualScene(description, aspectRatio);
    },
    [storeCreateManualScene]
  );

  const assignGroup = useCallback(
    async (sceneId: string, nextGroupId: string | null) => {
      const scene = scenes.find((entry) => entry.id === sceneId);
      if (!scene) {
        return;
      }
      if (!nextGroupId) {
        if (scene.groupId) {
          await removeScenesFromGroup(scene.groupId, [sceneId]);
        }
        return;
      }
      await assignScenesToGroup(nextGroupId, [sceneId]);
    },
    [assignScenesToGroup, removeScenesFromGroup, scenes]
  );

  const addTag = useCallback(
    async (sceneId: string, tagId: string) => {
      await assignTagsToScene(sceneId, [tagId]);
    },
    [assignTagsToScene]
  );

  const removeTag = useCallback(
    async (sceneId: string, tagId: string) => {
      await removeTagsFromScene(sceneId, [tagId]);
    },
    [removeTagsFromScene]
  );

  const reorderScenes = useCallback(
    async (sceneIds: string[]) => {
      await storeReorderScenes(sceneIds);
    },
    [storeReorderScenes]
  );

  const exportImage = useCallback(
    (imageUrl: string, sceneDescription: string) => {
      if (!imageUrl) return;
      const link = document.createElement("a");
      link.href = imageUrl;
      const filename = sceneDescription
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .substring(0, 50);
      link.download = `vibeboard-scene-${filename || "image"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    []
  );

  const exportAllImages = useCallback(
    (scenes: Scene[]) => {
      scenes
        .filter((scene) => scene.imageUrl)
        .forEach((scene) => exportImage(scene.imageUrl!, scene.description));
    },
    [exportImage]
  );

  return {
    updateScene,
    duplicateScene,
    deleteScene,
    createManualScene,
    assignGroup,
    addTag,
    removeTag,
    reorderScenes,
    exportImage,
    exportAllImages,
  };
};
