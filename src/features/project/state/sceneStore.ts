import type { StateCreator } from "zustand";
import type {
  Scene,
  SceneUIState,
  ScenePanelName,
  ScenePanelsState,
  SceneErrorState,
  SceneAssetStatus,
  SceneHistoryEntry,
} from "../../../types";
import type { SceneRecord } from "../../../types/services";
import type { ProjectServices } from "../services/projectServices";

// Helper functions for scene creation and transformation
const deriveAssetStatus = (
  status: SceneRecord["imageStatus"],
  assetId?: string | null
): SceneAssetStatus => {
  if (status === "ready" || status === "missing" || status === "absent") {
    return status as SceneAssetStatus;
  }
  return assetId ? "ready" : "absent";
};

const createAssetMissingError = (
  imageStatus: SceneAssetStatus,
  videoStatus: SceneAssetStatus
): SceneErrorState | null => {
  const missing: Array<"image" | "video"> = [];
  if (imageStatus === "missing") missing.push("image");
  if (videoStatus === "missing") missing.push("video");
  if (missing.length === 0) return null;
  const assetLabel =
    missing.length === 2 ? "image and video assets" : `${missing[0]} asset`;
  return {
    kind: "asset-missing",
    message: `We couldn't locate the latest ${assetLabel}. Regenerate to continue working.`,
    canRetry: true,
    occurredAt: Date.now(),
  };
};

const createSceneBase = (record: SceneRecord) => {
  const imageStatus = deriveAssetStatus(
    record.imageStatus,
    record.primaryImageAssetId
  );
  const videoStatus = deriveAssetStatus(
    record.videoStatus,
    record.primaryVideoAssetId
  );
  const groupId = record.groupId ?? record.groupIds?.[0] ?? null;
  const groupIds = record.groupIds ?? (groupId ? [groupId] : []);
  const tagIds = record.tagIds ?? [];
  return {
    id: record.id,
    projectId: record.projectId,
    description: record.description,
    aspectRatio: record.aspectRatio,
    orderIndex: record.orderIndex,
    imageUrl: record.imageUrl ?? undefined,
    videoUrl: record.videoUrl ?? undefined,
    imageAssetId: record.primaryImageAssetId ?? null,
    videoAssetId: record.primaryVideoAssetId ?? null,
    groupId,
    groupIds,
    tagIds,
    imageStatus: imageStatus as SceneAssetStatus,
    videoStatus: videoStatus as SceneAssetStatus,
    duration: record.duration ?? 5, // Default to 5 seconds if not set
  } satisfies Omit<Scene, "uiState">;
};

export const createScene = (record: SceneRecord): Scene => {
  const base = createSceneBase(record);
  return {
    ...base,
    uiState: {
      activity: "idle",
      panels: { edit: false, animate: false },
      lastError: createAssetMissingError(base.imageStatus, base.videoStatus),
      autoplayPending: false,
    },
  };
};

// Scene slice state interface
export interface SceneSlice {
  scenes: Scene[];

  // Scene record operations
  updateSceneRecord: (record: SceneRecord) => void;
  appendSceneRecords: (records: SceneRecord[]) => void;

  // Scene UI state operations
  setSceneUiState: (
    sceneId: string,
    updater: (state: SceneUIState, scene: Scene) => SceneUIState
  ) => void;
  setSceneActivity: (
    sceneId: string,
    activity: Scene["uiState"]["activity"]
  ) => void;
  setScenePanels: (
    sceneId: string,
    updater: (panels: ScenePanelsState, scene: Scene) => ScenePanelsState
  ) => void;
  setScenePanelState: (
    sceneId: string,
    panel: ScenePanelName,
    isOpen: boolean
  ) => void;
  toggleScenePanel: (sceneId: string, panel: ScenePanelName) => void;
  setSceneError: (sceneId: string, error: SceneErrorState | null) => void;
  resetSceneState: (sceneId: string) => void;

  // Scene CRUD operations
  reorderScenes: (sceneIds: string[]) => Promise<void>;
  duplicateScene: (sceneId: string) => Promise<void>;
  deleteScene: (sceneId: string) => Promise<void>;
  createManualScene: (
    description: string,
    aspectRatio: "16:9" | "9:16" | "1:1"
  ) => Promise<string>; // returns created scene id

  // Scene history operations
  loadSceneHistory: (sceneId: string) => Promise<SceneHistoryEntry[]>;
  restoreSceneFromHistory: (
    sceneId: string,
    historyId: string
  ) => Promise<SceneRecord | null>;
}

// Type for accessing the full store state (including properties from other slices)
export interface SceneSliceStore extends SceneSlice {
  _services: ProjectServices | null;
  activeProjectId: string | null;
  enqueueToast: (t: {
    type: "success" | "error" | "info";
    message: string;
  }) => void;
  refreshActiveProject: () => Promise<void>;
  appendSceneRecords: (records: SceneRecord[]) => void;
  updateSceneRecord: (record: SceneRecord) => void;
}

export const createSceneSlice: StateCreator<
  SceneSliceStore,
  [],
  [],
  SceneSlice
> = (set, get) => ({
  scenes: [],

  updateSceneRecord: (record) => {
    set((s) => ({
      scenes: s.scenes.map((scene) => {
        if (scene.id !== record.id) return scene;
        const base = createSceneBase(record);
        const assetError = createAssetMissingError(
          base.imageStatus,
          base.videoStatus
        );
        const nextLastError = assetError
          ? assetError
          : scene.uiState.lastError?.kind === "asset-missing"
          ? null
          : scene.uiState.lastError;
        return {
          ...scene,
          ...base,
          uiState: { ...scene.uiState, lastError: nextLastError },
        };
      }),
    }));
  },

  appendSceneRecords: (records) => {
    set((s) => ({ scenes: [...s.scenes, ...records.map(createScene)] }));
  },

  setSceneUiState: (sceneId, updater) => {
    set((s) => ({
      scenes: s.scenes.map((scene) =>
        scene.id === sceneId
          ? { ...scene, uiState: updater(scene.uiState, scene) }
          : scene
      ),
    }));
  },

  setSceneActivity: (sceneId, activity) => {
    set((s) => ({
      scenes: s.scenes.map((scene) =>
        scene.id === sceneId
          ? { ...scene, uiState: { ...scene.uiState, activity } }
          : scene
      ),
    }));
  },

  setScenePanels: (sceneId, updater) => {
    set((s) => ({
      scenes: s.scenes.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              uiState: {
                ...scene.uiState,
                panels: updater(scene.uiState.panels, scene),
              },
            }
          : scene
      ),
    }));
  },

  setScenePanelState: (sceneId, panel, isOpen) => {
    set((s) => ({
      scenes: s.scenes.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              uiState: {
                ...scene.uiState,
                panels: { ...scene.uiState.panels, [panel]: isOpen },
              },
            }
          : scene
      ),
    }));
  },

  toggleScenePanel: (sceneId, panel) => {
    set((s) => ({
      scenes: s.scenes.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              uiState: {
                ...scene.uiState,
                panels: {
                  ...scene.uiState.panels,
                  [panel]: !scene.uiState.panels[panel],
                },
              },
            }
          : scene
      ),
    }));
  },

  setSceneError: (sceneId, error) => {
    set((s) => ({
      scenes: s.scenes.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              uiState: {
                ...scene.uiState,
                lastError: error
                  ? { ...error, occurredAt: error.occurredAt ?? Date.now() }
                  : null,
              },
            }
          : scene
      ),
    }));
  },

  resetSceneState: (sceneId) => {
    get().setSceneActivity(sceneId, "idle");
  },

  reorderScenes: async (sceneIds) => {
    const { _services: services, activeProjectId } = get();
    if (!services || !activeProjectId) return;

    // Optimistic update
    set((s) => {
      const map = new Map(s.scenes.map((sc) => [sc.id, sc] as const));
      return { scenes: sceneIds.map((id) => map.get(id)!).filter(Boolean) };
    });

    try {
      const reordered = await services.reorderScenes(activeProjectId, sceneIds);
      set((s) => {
        const map = new Map<string, Scene>(s.scenes.map((sc) => [sc.id, sc]));
        return {
          scenes: reordered.map((rec) => {
            const existing = map.get(rec.id);
            if (existing) {
              const base = createSceneBase(rec);
              return { ...base, uiState: existing.uiState } as Scene;
            }
            return createScene(rec);
          }),
        };
      });
    } catch (e) {
      console.error("Failed to reorder scenes", e);
      await get().refreshActiveProject();
      get().enqueueToast({
        type: "error",
        message: "Failed to reorder scenes. Changes reverted.",
      });
    }
  },

  duplicateScene: async (sceneId) => {
    const { _services: services, activeProjectId, scenes } = get();
    if (!services || !activeProjectId) return;

    const source = scenes.find((s) => s.id === sceneId);
    if (!source) return;

    try {
      const [created] = await services.createScenes(activeProjectId, [
        {
          description: source.description,
          aspectRatio: source.aspectRatio,
          orderIndex: scenes.length,
        },
      ]);

      let latestRecord = created;
      if (source.imageAssetId || source.videoAssetId) {
        latestRecord = await services.updateScene(activeProjectId, created.id, {
          primaryImageAssetId: source.imageAssetId ?? null,
          primaryVideoAssetId: source.videoAssetId ?? null,
        });
      }

      get().appendSceneRecords([latestRecord]);

      if (source.groupId) {
        await services.assignScenesToGroup(activeProjectId, source.groupId, [
          latestRecord.id,
        ]);
        set((s) => ({
          scenes: s.scenes.map((sc) =>
            sc.id === latestRecord.id
              ? {
                  ...sc,
                  groupId: source.groupId!,
                  groupIds: [source.groupId!],
                }
              : sc
          ),
        }));
      }

      if (source.tagIds && source.tagIds.length > 0) {
        await services.assignTags(
          activeProjectId,
          latestRecord.id,
          source.tagIds
        );
        set((s) => ({
          scenes: s.scenes.map((sc) =>
            sc.id === latestRecord.id
              ? { ...sc, tagIds: Array.from(new Set(source.tagIds ?? [])) }
              : sc
          ),
        }));
      }
    } catch (e) {
      console.error("Failed to duplicate scene", e);
    }
  },

  deleteScene: async (sceneId) => {
    const { _services: services, activeProjectId } = get();
    if (!services || !activeProjectId) return;

    try {
      const remaining = await services.deleteScene(activeProjectId, sceneId);
      // Update scenes list and also clean up group/tag memberships locally
      set((s) => {
        const remainingIds = new Set(remaining.map((r) => r.id));
        return {
          scenes: remaining.map(createScene),
          groups: (s as any).groups?.map((g: any) => ({
            ...g,
            sceneIds: (g.sceneIds ?? []).filter((id: string) =>
              remainingIds.has(id)
            ),
          })),
          tags: (s as any).tags?.map((t: any) => ({
            ...t,
            sceneIds: (t.sceneIds ?? []).filter((id: string) =>
              remainingIds.has(id)
            ),
          })),
        } as any;
      });
      get().enqueueToast({ type: "success", message: "Scene deleted" });
    } catch (e) {
      console.error("Failed to delete scene", e);
      get().enqueueToast({ type: "error", message: "Failed to delete scene" });
    }
  },

  createManualScene: async (description, aspectRatio) => {
    const { _services: services, activeProjectId, scenes } = get();
    if (!services || !activeProjectId) {
      throw new Error("No active project or services unavailable");
    }

    try {
      const [created] = await services.createScenes(activeProjectId, [
        { description, aspectRatio, orderIndex: scenes.length },
      ]);
      get().appendSceneRecords([created]);
      return created.id;
    } catch (e) {
      console.error("Failed to create manual scene", e);
      throw e;
    }
  },

  loadSceneHistory: async (sceneId) => {
    const { _services: services, activeProjectId } = get();
    if (!services || !activeProjectId) return [];
    return services.listSceneHistory(activeProjectId, sceneId);
  },

  restoreSceneFromHistory: async (sceneId, historyId) => {
    const { _services: services, activeProjectId } = get();
    if (!services || !activeProjectId) return null;

    const restored = await services.restoreSceneFromHistory(
      activeProjectId,
      sceneId,
      historyId
    );
    get().updateSceneRecord(restored);
    return restored;
  },
});
