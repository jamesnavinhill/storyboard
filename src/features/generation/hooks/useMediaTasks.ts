import { useCallback, useMemo } from "react";
import type {
  PresetStyle,
  Scene,
  SceneErrorKind,
  Settings,
  VideoModel,
} from "../../../types";
import { useServices } from "../../../services/registry";
import {
  editImageForScene,
  generateImageForScene,
  generateVideoForScene,
  extendVideoForScene,
  suggestImageEditPrompt as svcSuggestImageEditPrompt,
  suggestVideoPrompt as svcSuggestVideoPrompt,
} from "../services/mediaService";
import { mapProviderErrorToMessage } from "../../../utils/errorMapper";

interface ProjectStateLike {
  activeProjectId: string | null;
  scenes: Scene[];
  settings: Settings;
  setSceneActivity: (
    sceneId: string,
    activity: Scene["uiState"]["activity"]
  ) => void;
  resetSceneState: (sceneId: string) => void;
  updateSceneRecord: (record: any) => void;
  setSceneError: (
    sceneId: string,
    error: {
      kind: SceneErrorKind;
      message: string;
      canRetry: boolean;
      occurredAt: number;
      requestId?: string;
      docLink?: string;
      errorCode?: string;
    } | null
  ) => void;
  toggleScenePanel: (sceneId: string, panel: "edit" | "animate") => void;
  setScenePanelState: (
    sceneId: string,
    panel: "edit" | "animate",
    open: boolean
  ) => void;
  setSceneUiState: (
    sceneId: string,
    updater: (state: Scene["uiState"]) => Scene["uiState"]
  ) => void;
}

export interface UseMediaTasksOptions {
  projectState: ProjectStateLike;
  sessionOverrides?: Partial<Settings>;
}

export const useMediaTasks = (options: UseMediaTasksOptions) => {
  const { projectState } = options;
  const services = useServices();

  const mergedSettings = useCallback((): Settings => {
    return {
      ...projectState.settings,
      ...(options.sessionOverrides ?? {}),
    } as Settings;
  }, [projectState.settings, options.sessionOverrides]);

  const clearSceneErrorByKind = useCallback(
    (sceneId: string, kind: SceneErrorKind) => {
      const scene = projectState.scenes.find((s) => s.id === sceneId);
      if (scene?.uiState.lastError?.kind === kind) {
        projectState.setSceneError(sceneId, null);
      }
    },
    [projectState]
  );

  const generateImage = useCallback(
    async (sceneId: string, styles: PresetStyle[], templateIds?: string[]) => {
      const projectId = projectState.activeProjectId;
      if (!projectId) return;
      const scene = projectState.scenes.find((s) => s.id === sceneId);
      if (!scene || scene.uiState.activity !== "idle") return;
      projectState.setSceneActivity(sceneId, "generating-image");
      try {
        clearSceneErrorByKind(sceneId, "image-generation");
        const promptTexts = styles.map((s) => s.prompt);
        const updated = await generateImageForScene(services, {
          projectId,
          sceneId,
          description: scene.description,
          aspectRatio: scene.aspectRatio,
          stylePrompts: promptTexts,
          settings: {
            imageModel: mergedSettings().imageModel,
            workflow: mergedSettings().workflow,
          },
          templateIds,
        });
        projectState.updateSceneRecord(updated);
        clearSceneErrorByKind(sceneId, "image-generation");
      } catch (error) {
        const mapped = mapProviderErrorToMessage(error);
        projectState.setSceneError(sceneId, {
          kind: "image-generation",
          message: mapped.message,
          canRetry: mapped.retryable ?? true,
          occurredAt: Date.now(),
          requestId: mapped.requestId,
          docLink: mapped.docLink,
          errorCode: mapped.errorCode,
        });
      } finally {
        projectState.resetSceneState(sceneId);
      }
    },
    [projectState, services, mergedSettings, clearSceneErrorByKind]
  );

  const editImage = useCallback(
    async ({ sceneId, prompt }: { sceneId: string; prompt: string }) => {
      const projectId = projectState.activeProjectId;
      if (!projectId) return;
      const scene = projectState.scenes.find((s) => s.id === sceneId);
      if (!scene || scene.uiState.activity !== "idle") return;
      projectState.setSceneActivity(sceneId, "editing-image");
      let shouldClose = false;
      try {
        clearSceneErrorByKind(sceneId, "image-edit");
        const updated = await editImageForScene(services, {
          projectId,
          sceneId,
          prompt,
        });
        projectState.updateSceneRecord(updated);
        clearSceneErrorByKind(sceneId, "image-edit");
        shouldClose = true;
      } catch (error) {
        const mapped = mapProviderErrorToMessage(error);
        projectState.setSceneError(sceneId, {
          kind: "image-edit",
          message: mapped.message,
          canRetry: mapped.retryable ?? true,
          occurredAt: Date.now(),
          requestId: mapped.requestId,
          docLink: mapped.docLink,
          errorCode: mapped.errorCode,
        });
      } finally {
        projectState.resetSceneState(sceneId);
      }
      if (shouldClose) {
        projectState.setScenePanelState(sceneId, "edit", false);
      }
    },
    [projectState, services, clearSceneErrorByKind]
  );

  const generateVideo = useCallback(
    async ({ sceneId, prompt }: { sceneId: string; prompt: string }) => {
      const projectId = projectState.activeProjectId;
      if (!projectId) return;
      const scene = projectState.scenes.find((s) => s.id === sceneId);
      if (!scene || scene.uiState.activity !== "idle") return;
      projectState.setSceneActivity(sceneId, "generating-video");
      let shouldClose = false;
      try {
        clearSceneErrorByKind(sceneId, "video-generation");
        const updated = await generateVideoForScene(services, {
          projectId,
          sceneId,
          prompt,
          model: mergedSettings().videoModel,
          aspectRatio: scene.aspectRatio,
        });
        projectState.updateSceneRecord(updated);
        clearSceneErrorByKind(sceneId, "video-generation");
        shouldClose = true;
        if (mergedSettings().videoAutoplay === "on-generate") {
          projectState.setSceneUiState(sceneId, (state) => ({
            ...state,
            autoplayPending: true,
          }));
        }
      } catch (error) {
        const mapped = mapProviderErrorToMessage(error);
        projectState.setSceneError(sceneId, {
          kind: "video-generation",
          message: mapped.message,
          canRetry: mapped.retryable ?? true,
          occurredAt: Date.now(),
          requestId: mapped.requestId,
          docLink: mapped.docLink,
          errorCode: mapped.errorCode,
        });
      } finally {
        projectState.resetSceneState(sceneId);
      }
      if (shouldClose) {
        projectState.setScenePanelState(sceneId, "animate", false);
      }
    },
    [projectState, services, mergedSettings, clearSceneErrorByKind]
  );

  const toggleEditPanel = useCallback(
    (sceneId: string) => {
      const scene = projectState.scenes.find((s) => s.id === sceneId);
      if (!scene || !scene.imageAssetId) return;
      projectState.toggleScenePanel(sceneId, "edit");
    },
    [projectState]
  );

  const toggleAnimatePanel = useCallback(
    (sceneId: string) => {
      const scene = projectState.scenes.find((s) => s.id === sceneId);
      if (!scene || !scene.imageAssetId) return;
      projectState.toggleScenePanel(sceneId, "animate");
    },
    [projectState]
  );

  const suggestVideoPrompt = useCallback(
    async (sceneId: string) => {
      const scene = projectState.scenes.find((s) => s.id === sceneId);
      if (!scene) return null;
      try {
        return await svcSuggestVideoPrompt(services, {
          projectId: scene.projectId ?? projectState.activeProjectId!,
          sceneId: scene.id,
        });
      } catch {
        return null;
      }
    },
    [projectState, services]
  );

  const suggestImageEditPrompt = useCallback(
    async (sceneId: string) => {
      const scene = projectState.scenes.find((s) => s.id === sceneId);
      if (!scene) return null;
      try {
        return await svcSuggestImageEditPrompt(services, {
          projectId: scene.projectId ?? projectState.activeProjectId!,
          sceneId: scene.id,
        });
      } catch {
        return null;
      }
    },
    [projectState, services]
  );

  const extendVideo = useCallback(
    async ({
      sceneId,
      prompt,
      extensionCount,
      model,
    }: {
      sceneId: string;
      prompt: string;
      extensionCount: number;
      model: VideoModel;
    }) => {
      const projectId = projectState.activeProjectId;
      if (!projectId) return;
      const scene = projectState.scenes.find((s) => s.id === sceneId);
      if (!scene || scene.uiState.activity !== "idle") return;
      projectState.setSceneActivity(sceneId, "generating-video");
      try {
        clearSceneErrorByKind(sceneId, "video-generation");
        const updated = await extendVideoForScene(services, {
          projectId,
          sceneId,
          prompt,
          model,
          extensionCount,
        });
        projectState.updateSceneRecord(updated);
        clearSceneErrorByKind(sceneId, "video-generation");
        if (mergedSettings().videoAutoplay === "on-generate") {
          projectState.setSceneUiState(sceneId, (state) => ({
            ...state,
            autoplayPending: true,
          }));
        }
      } catch (error) {
        const mapped = mapProviderErrorToMessage(error);
        projectState.setSceneError(sceneId, {
          kind: "video-generation",
          message: mapped.message,
          canRetry: mapped.retryable ?? true,
          occurredAt: Date.now(),
          requestId: mapped.requestId,
          docLink: mapped.docLink,
          errorCode: mapped.errorCode,
        });
      } finally {
        projectState.resetSceneState(sceneId);
      }
    },
    [projectState, services, mergedSettings, clearSceneErrorByKind]
  );

  return useMemo(
    () => ({
      generateImage,
      editImage,
      generateVideo,
      extendVideo,
      toggleEditPanel,
      toggleAnimatePanel,
      suggestVideoPrompt,
      suggestImageEditPrompt,
    }),
    [
      generateImage,
      editImage,
      generateVideo,
      extendVideo,
      toggleEditPanel,
      toggleAnimatePanel,
      suggestVideoPrompt,
      suggestImageEditPrompt,
    ]
  );
};
